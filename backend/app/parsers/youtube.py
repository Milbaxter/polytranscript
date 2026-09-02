import re
import os
import tempfile
import asyncio
from typing import Optional, List
import yt_dlp
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

from app.models import MediaMetadata, TranscriptResponse, TranscriptSegment
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber
from app.config import settings
from app.utils.proxy import ytdlp_proxy_opts, youtube_transcript_api_client

YOUTUBE_REGEX = re.compile(
    r'(?:https?://)?(?:www\.|m\.|music\.)?(?:youtube\.com/(?:watch\?v=|embed/|v/|shorts/)|youtu\.be/)([\w-]{11})'
)


class YouTubeParser(BaseMediaParser):
    def can_handle(self, url: str) -> bool:
        return bool(YOUTUBE_REGEX.search(url))

    def extract_video_id(self, url: str) -> Optional[str]:
        match = YOUTUBE_REGEX.search(url)
        return match.group(1) if match else None

    async def extract_metadata(self, url: str) -> MediaMetadata:
        video_id = self.extract_video_id(url)
        if not video_id:
            return MediaMetadata(title="Unknown YouTube Video", platform="youtube", url=url)

        ydl_opts = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            **ytdlp_proxy_opts(),
        }

        def _fetch_meta():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                    return MediaMetadata(
                        title=info.get('title', f"YouTube Video ({video_id})"),
                        author=info.get('uploader') or info.get('channel', 'Unknown Creator'),
                        duration_seconds=float(info.get('duration', 0.0)),
                        thumbnail_url=info.get('thumbnail') or f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                        view_count=info.get('view_count'),
                        upload_date=info.get('upload_date'),
                        platform="youtube",
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        description=(info.get('description') or '')[:500]
                    )
            except Exception:
                return MediaMetadata(
                    title=f"YouTube Video ({video_id})",
                    author="YouTube Creator",
                    thumbnail_url=f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    platform="youtube",
                    url=f"https://www.youtube.com/watch?v={video_id}"
                )

        return await asyncio.to_thread(_fetch_meta)

    def _fetch_captions_sync(self, video_id: str, language: str):
        try:
            ytt = youtube_transcript_api_client()
            transcript_list = ytt.list(video_id)
            t = None

            for lang_code in [language, 'en', 'en-US', 'en-GB']:
                try:
                    t = transcript_list.find_transcript([lang_code])
                    break
                except Exception:
                    continue

            if not t:
                for tr in transcript_list:
                    if not tr.is_generated:
                        t = tr
                        break

            if not t:
                t = next(iter(transcript_list))

            raw_data = t.fetch()
            return raw_data, t.language_code
        except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, Exception):
            return None, None

    def _captions_to_response(self, raw_captions, lang, language, metadata) -> TranscriptResponse:
        segments: List[TranscriptSegment] = []
        text_parts = []
        for item in raw_captions:
            if isinstance(item, dict):
                start = float(item.get('start', 0.0))
                duration = float(item.get('duration', 0.0))
                text = str(item.get('text', '')).replace('\n', ' ').strip()
            else:
                start = float(getattr(item, 'start', 0.0))
                duration = float(getattr(item, 'duration', 0.0))
                text = str(getattr(item, 'text', '')).replace('\n', ' ').strip()

            if text:
                segments.append(TranscriptSegment(
                    start=round(start, 2),
                    end=round(start + duration, 2),
                    text=text
                ))
                text_parts.append(text)

        full_text = " ".join(text_parts)
        return TranscriptResponse(
            metadata=metadata,
            language=lang or language,
            full_text=full_text,
            segments=segments,
            source_type="youtube_captions",
            word_count=len(full_text.split())
        )

    async def extract_captions_only(self, url: str, language: str = "en") -> Optional[TranscriptResponse]:
        """TimedText/captions only — no audio download. Returns None if captions are missing."""
        video_id = self.extract_video_id(url)
        if not video_id:
            return None
        raw_captions, lang = await asyncio.to_thread(self._fetch_captions_sync, video_id, language)
        if not raw_captions:
            return None
        metadata = await self.extract_metadata(url)
        return self._captions_to_response(raw_captions, lang, language, metadata)

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL: {url}")

        captions = await self.extract_captions_only(url, language=language)
        if captions:
            return captions

        metadata = await self.extract_metadata(url)
        audio_path = await self._download_youtube_audio(video_id)
        try:
            full_text, segments = await transcriber.transcribe_audio_file(audio_path, language=language)
            return TranscriptResponse(
                metadata=metadata,
                language=language,
                full_text=full_text,
                segments=segments,
                source_type="whisper_ai_audio",
                word_count=len(full_text.split())
            )
        finally:
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception:
                    pass

    async def _download_youtube_audio(self, video_id: str) -> str:
        temp_out = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': temp_out.replace(".mp3", ""),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64',
            }],
            'quiet': True,
            'no_warnings': True,
            **ytdlp_proxy_opts(),
        }

        def _download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            if os.path.exists(temp_out):
                return temp_out
            if os.path.exists(temp_out + ".mp3"):
                return temp_out + ".mp3"
            return temp_out

        return await asyncio.to_thread(_download)


youtube_parser = YouTubeParser()
