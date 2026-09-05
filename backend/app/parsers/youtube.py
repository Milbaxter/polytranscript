import re
import os
import tempfile
import asyncio
from typing import Optional, List
import httpx
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

from app.models import MediaMetadata, TranscriptResponse, TranscriptSegment
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber
from app.config import settings

IOS_PLAYER_UA = "com.google.ios.youtube/21.02.3 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)"

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
            'extract_flat': False
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
                        description=info.get('description', '')[:500]
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

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL: {url}")

        metadata_task = self.extract_metadata(url)

        ios_captions = await self._fetch_ios_captions(video_id, language)
        if ios_captions:
            metadata = await metadata_task
            raw_captions, lang = ios_captions
            return self._captions_to_response(raw_captions, lang, language, metadata)

        # 1. Try youtube-transcript-api (often blocked without a PO token)
        def _get_yt_captions():
            try:
                ytt = YouTubeTranscriptApi()
                transcript_list = ytt.list(video_id)
                t = None
                
                # Priority 1: Exact requested language
                for lang_code in [language, 'en', 'en-US', 'en-GB']:
                    try:
                        t = transcript_list.find_transcript([lang_code])
                        break
                    except Exception:
                        continue

                # Priority 2: Try finding manually created transcript
                if not t:
                    for tr in transcript_list:
                        if not tr.is_generated:
                            t = tr
                            break

                # Priority 3: Any available transcript
                if not t:
                    t = next(iter(transcript_list))
                
                raw_data = t.fetch()
                actual_lang = t.language_code
                return raw_data, actual_lang
            except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable, Exception) as e:
                return None, None

        raw_captions, lang = await asyncio.to_thread(_get_yt_captions)
        metadata = await metadata_task

        if raw_captions:
            return self._captions_to_response(raw_captions, lang, language, metadata)

        # 2. Fallback: Download audio stream and transcribe via Whisper
        audio_path = await self._download_youtube_audio(video_id)
        try:
            full_text, segments = await transcriber.transcribe_audio_file(audio_path, language=language)
            word_count = len(full_text.split())
            return TranscriptResponse(
                metadata=metadata,
                language=language,
                full_text=full_text,
                segments=segments,
                source_type="whisper_ai_audio",
                word_count=word_count
            )
        finally:
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception:
                    pass

    def _captions_to_response(self, raw_captions, lang, language, metadata) -> TranscriptResponse:
        segments: List[TranscriptSegment] = []
        text_parts = []
        for item in raw_captions:
            if isinstance(item, dict):
                start = float(item.get("start", 0.0))
                duration = float(item.get("duration", 0.0))
                text = str(item.get("text", "")).replace("\n", " ").strip()
            else:
                start = float(getattr(item, "start", 0.0))
                duration = float(getattr(item, "duration", 0.0))
                text = str(getattr(item, "text", "")).replace("\n", " ").strip()
            if text:
                segments.append(
                    TranscriptSegment(
                        start=round(start, 2),
                        end=round(start + duration, 2),
                        text=text,
                    )
                )
                text_parts.append(text)

        full_text = " ".join(text_parts)
        return TranscriptResponse(
            metadata=metadata,
            language=lang or language,
            full_text=full_text,
            segments=segments,
            source_type="youtube_captions",
            word_count=len(full_text.split()),
        )

    async def _fetch_ios_captions(self, video_id: str, language: str):
        """Fetch captions via the iOS Innertube player client (no PO token required)."""
        payload = {
            "context": {
                "client": {
                    "clientName": "IOS",
                    "clientVersion": "21.02.3",
                    "deviceMake": "Apple",
                    "deviceModel": "iPhone16,2",
                    "osName": "iPhone",
                    "osVersion": "18.3.2.22D82",
                    "hl": "en",
                    "gl": "US",
                }
            },
            "videoId": video_id,
            "contentCheckOk": True,
            "racyCheckOk": True,
        }
        headers = {
            "Content-Type": "application/json",
            "User-Agent": IOS_PLAYER_UA,
            "X-YouTube-Client-Name": "5",
        }
        try:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                player = await client.post(
                    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
                    json=payload,
                    headers=headers,
                )
                if player.status_code != 200:
                    return None
                data = player.json()
                tracks = (
                    data.get("captions", {})
                    .get("playerCaptionsTracklistRenderer", {})
                    .get("captionTracks", [])
                )
                if not tracks:
                    return None
                wanted = (language or "en").lower()
                def score(t):
                    lang = str(t.get("languageCode") or "").lower()
                    n = 0
                    if lang == wanted:
                        n += 100
                    elif lang.startswith(wanted):
                        n += 80
                    elif lang.startswith("en"):
                        n += 20
                    if t.get("kind") != "asr":
                        n += 10
                    return n
                track = sorted(tracks, key=score, reverse=True)[0]
                base = track.get("baseUrl")
                if not base:
                    return None
                cap_url = base if "fmt=" in base else f"{base}&fmt=json3"
                cap = await client.get(cap_url, headers={"User-Agent": IOS_PLAYER_UA})
                if cap.status_code != 200 or not cap.content:
                    return None
                events = cap.json().get("events") or []
                raw = []
                for ev in events:
                    segs = ev.get("segs") or []
                    text = " ".join(s.get("utf8") or "" for s in segs).replace("\n", " ").strip()
                    if not text:
                        continue
                    start = (ev.get("tStartMs") or 0) / 1000.0
                    dur = (ev.get("dDurationMs") or 2000) / 1000.0
                    raw.append({"start": start, "duration": dur, "text": text})
                if not raw:
                    return None
                return raw, track.get("languageCode") or language
        except Exception:
            return None

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
            'no_warnings': True
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
