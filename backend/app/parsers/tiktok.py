import re
import os
import tempfile
import asyncio
from typing import Optional, List
import yt_dlp
import httpx

from app.models import MediaMetadata, TranscriptResponse, TranscriptSegment
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber
from app.config import settings

TIKTOK_REGEX = re.compile(
    r'(?:https?://)?(?:www\.|vm\.|vt\.|m\.)?tiktok\.com/(?:@[\w.-]+/video/\d+|[\w-]+|t/\w+)'
)

class TikTokParser(BaseMediaParser):
    def can_handle(self, url: str) -> bool:
        return bool(TIKTOK_REGEX.search(url))

    async def extract_metadata(self, url: str) -> MediaMetadata:
        ydl_opts = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }

        def _fetch():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    return MediaMetadata(
                        title=info.get('title') or info.get('description', 'TikTok Video')[:80],
                        author=info.get('uploader') or info.get('channel', 'TikTok Creator'),
                        duration_seconds=float(info.get('duration', 0.0)),
                        thumbnail_url=info.get('thumbnail'),
                        view_count=info.get('view_count'),
                        upload_date=info.get('upload_date'),
                        platform="tiktok",
                        url=url,
                        description=info.get('description', '')[:500]
                    )
            except Exception:
                return MediaMetadata(
                    title="TikTok Video",
                    author="TikTok Creator",
                    platform="tiktok",
                    url=url
                )

        return await asyncio.to_thread(_fetch)

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        metadata_task = self.extract_metadata(url)
        temp_audio = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': temp_audio.replace(".mp3", ""),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64',
            }],
            'quiet': True,
            'no_warnings': True,
            'writesubtitles': True,
            'allsubtitles': True,
        }

        def _fetch_and_download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                actual_file = temp_audio if os.path.exists(temp_audio) else temp_audio + ".mp3"
                return info, actual_file

        try:
            info, audio_file = await asyncio.to_thread(_fetch_and_download)
            metadata = await metadata_task

            # Check if direct subtitles exist in info
            subtitles = info.get('subtitles') or info.get('automatic_captions') or {}
            if subtitles and (language in subtitles or 'en' in subtitles):
                # Try parsing direct subtitle json if available
                sub_lang = language if language in subtitles else 'en'
                # Subtitles extracted or fallback to audio transcription
            
            # Transcribe audio file with Whisper
            full_text, segments = await transcriber.transcribe_audio_file(audio_file, language=language)
            word_count = len(full_text.split())

            return TranscriptResponse(
                metadata=metadata,
                language=language,
                full_text=full_text,
                segments=segments,
                source_type="tiktok_whisper_ai",
                word_count=word_count
            )
        finally:
            for p in [temp_audio, temp_audio + ".mp3"]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

tiktok_parser = TikTokParser()
