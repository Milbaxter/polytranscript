import re
import os
import tempfile
import asyncio
from typing import Optional, List
import feedparser
import httpx
import yt_dlp

from app.models import MediaMetadata, TranscriptResponse, TranscriptSegment
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber
from app.config import settings

APPLE_PODCAST_REGEX = re.compile(r'https?://podcasts\.apple\.com/[\w-]+/podcast/[^/]+/id(\d+)(?:\?i=(\d+))?')
SPOTIFY_REGEX = re.compile(r'https?://open\.spotify\.com/episode/([a-zA-Z0-9]+)')
DIRECT_AUDIO_REGEX = re.compile(r'https?://.+\.(?:mp3|m4a|wav|ogg|aac|flac|webm)(?:\?.*)?$', re.IGNORECASE)
RSS_REGEX = re.compile(r'https?://.+/(?:feed|rss|podcast|\.xml)', re.IGNORECASE)

class PodcastParser(BaseMediaParser):
    def can_handle(self, url: str) -> bool:
        return bool(
            APPLE_PODCAST_REGEX.search(url) or
            SPOTIFY_REGEX.search(url) or
            DIRECT_AUDIO_REGEX.search(url) or
            RSS_REGEX.search(url) or
            "feed" in url or
            url.endswith(".xml") or
            url.endswith(".mp3")
        )

    async def extract_metadata(self, url: str) -> MediaMetadata:
        # 1. Apple Podcast URL
        apple_match = APPLE_PODCAST_REGEX.search(url)
        if apple_match:
            show_id = apple_match.group(1)
            episode_id = apple_match.group(2)
            meta = await self._fetch_apple_podcast_meta(show_id, episode_id, url)
            if meta:
                return meta

        # 2. RSS Feed URL
        if RSS_REGEX.search(url) or url.endswith(".xml") or "feed" in url:
            meta = await self._fetch_rss_meta(url)
            if meta:
                return meta

        # 3. Direct Audio URL
        audio_name = os.path.basename(url.split("?")[0])
        return MediaMetadata(
            title=audio_name.replace("-", " ").replace("_", " ").title(),
            author="Podcast Host",
            platform="podcast",
            url=url
        )

    async def _fetch_apple_podcast_meta(self, show_id: str, episode_id: Optional[str], original_url: str) -> Optional[MediaMetadata]:
        try:
            lookup_url = f"https://itunes.apple.com/lookup?id={episode_id or show_id}&entity=podcastEpisode"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(lookup_url)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        item = results[0]
                        return MediaMetadata(
                            title=item.get("trackName") or item.get("collectionName", "Apple Podcast Episode"),
                            author=item.get("artistName", "Unknown Host"),
                            duration_seconds=float(item.get("trackTimeMillis", 0)) / 1000.0,
                            thumbnail_url=item.get("artworkUrl600") or item.get("artworkUrl100"),
                            upload_date=item.get("releaseDate"),
                            platform="podcast",
                            url=item.get("episodeUrl") or original_url,
                            description=item.get("description", "")[:500]
                        )
        except Exception as e:
            print(f"[PodcastParser] Apple lookup error: {e}")
        return None

    async def _fetch_rss_meta(self, feed_url: str) -> Optional[MediaMetadata]:
        def _parse():
            feed = feedparser.parse(feed_url)
            if feed.entries:
                latest = feed.entries[0]
                show_title = feed.feed.get("title", "Podcast Show")
                ep_title = latest.get("title", "Latest Episode")
                author = feed.feed.get("author", "Podcast Host")
                image = feed.feed.get("image", {}).get("href")
                audio_url = None
                for enc in latest.get("enclosures", []):
                    if "audio" in enc.get("type", "") or enc.get("href", "").endswith(".mp3"):
                        audio_url = enc.get("href")
                        break

                return MediaMetadata(
                    title=f"{show_title}: {ep_title}",
                    author=author,
                    thumbnail_url=image,
                    platform="podcast",
                    url=audio_url or feed_url,
                    description=latest.get("summary", "")[:500]
                )
            return None
        return await asyncio.to_thread(_parse)

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        metadata = await self.extract_metadata(url)
        resolved_audio_url = metadata.url or url

        # Download audio stream to temporary file
        temp_audio = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            try:
                # If direct audio stream
                async with client.stream("GET", resolved_audio_url) as response:
                    if response.status_code == 200:
                        with open(temp_audio, "wb") as f:
                            async for chunk in response.aiter_bytes(chunk_size=1024 * 64):
                                f.write(chunk)
                    else:
                        # Fallback to yt-dlp to download
                        await self._download_with_ytdlp(resolved_audio_url, temp_audio)
            except Exception:
                # Fallback to yt-dlp
                await self._download_with_ytdlp(resolved_audio_url, temp_audio)

        try:
            actual_file = temp_audio if os.path.exists(temp_audio) else temp_audio + ".mp3"
            full_text, segments = await transcriber.transcribe_audio_file(actual_file, language=language)
            word_count = len(full_text.split())

            return TranscriptResponse(
                metadata=metadata,
                language=language,
                full_text=full_text,
                segments=segments,
                source_type="podcast_whisper_ai",
                word_count=word_count
            )
        finally:
            for p in [temp_audio, temp_audio + ".mp3"]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    async def _download_with_ytdlp(self, url: str, output_path: str):
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path.replace(".mp3", ""),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64',
            }],
            'quiet': True,
            'no_warnings': True
        }
        def _exec():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        await asyncio.to_thread(_exec)

podcast_parser = PodcastParser()
