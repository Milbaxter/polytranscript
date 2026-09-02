import re
import os
import tempfile
import asyncio
from typing import Optional
from urllib.parse import parse_qs, urlparse
import feedparser
import httpx
import yt_dlp

from app.models import MediaMetadata, TranscriptResponse
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber
from app.config import settings
from app.utils.proxy import ytdlp_proxy_opts, httpx_proxy_kw

APPLE_PODCAST_REGEX = re.compile(r'https?://podcasts\.apple\.com/[\w-]+/podcast/[^/]+/id(\d+)(?:\?i=(\d+))?')
SPOTIFY_REGEX = re.compile(r'https?://open\.spotify\.com/(episode|show)/([a-zA-Z0-9]+)')
DIRECT_AUDIO_REGEX = re.compile(r'https?://.+\.(?:mp3|m4a|wav|ogg|aac|flac|webm)(?:\?.*)?$', re.IGNORECASE)
RSS_REGEX = re.compile(r'https?://.+/(?:feed|rss|podcast|\.xml)', re.IGNORECASE)

SPOTIFY_DRM_MSG = (
    "Spotify episodes are DRM-protected and cannot be downloaded as MP3. "
    "Provide an Apple Podcasts episode link, a public RSS episode permalink "
    "(or ?episode=<guid|title>), or a direct MP3/M4A enclosure URL."
)


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

    def _reject_spotify(self, url: str) -> None:
        if SPOTIFY_REGEX.search(url):
            raise ValueError(SPOTIFY_DRM_MSG)

    async def extract_metadata(self, url: str) -> MediaMetadata:
        self._reject_spotify(url)
        apple_match = APPLE_PODCAST_REGEX.search(url)
        if apple_match:
            show_id = apple_match.group(1)
            episode_id = apple_match.group(2)
            meta = await self._fetch_apple_podcast_meta(show_id, episode_id, url)
            if meta:
                return meta
        if RSS_REGEX.search(url) or url.endswith(".xml") or "feed" in url:
            meta = await self._fetch_rss_meta(url)
            if meta:
                return meta
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
            async with httpx.AsyncClient(timeout=10.0, **httpx_proxy_kw()) as client:
                resp = await client.get(lookup_url)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        item = results[0]
                        audio = item.get("episodeUrl") or original_url
                        return MediaMetadata(
                            title=item.get("trackName") or item.get("collectionName", "Apple Podcast Episode"),
                            author=item.get("artistName", "Unknown Host"),
                            duration_seconds=float(item.get("trackTimeMillis", 0)) / 1000.0,
                            thumbnail_url=item.get("artworkUrl600") or item.get("artworkUrl100"),
                            upload_date=item.get("releaseDate"),
                            platform="podcast",
                            url=audio,
                            description=(item.get("description") or "")[:500]
                        )
        except Exception as e:
            print(f"[PodcastParser] Apple lookup error: {e}")
        return None

    def _select_rss_entry(self, feed, requested_url: str):
        parsed = urlparse(requested_url)
        qs = parse_qs(parsed.query)
        hints = []
        for key in ("i", "episode", "guid", "id"):
            if qs.get(key):
                hints.extend(qs[key])
        if parsed.fragment:
            hints.append(parsed.fragment)

        def _entry_urls(entry):
            urls = [entry.get("link") or "", str(entry.get("id") or ""), str(entry.get("guid") or "")]
            for enc in entry.get("enclosures") or []:
                urls.append(enc.get("href") or "")
            return urls

        for entry in feed.entries:
            for candidate in _entry_urls(entry):
                if candidate and (candidate == requested_url or requested_url in candidate or candidate in requested_url):
                    if candidate.endswith((".mp3", ".m4a", ".ogg", ".wav")) or requested_url.endswith((".mp3", ".m4a")):
                        return entry
                    if entry.get("link") == requested_url or str(entry.get("id") or "") == requested_url:
                        return entry

        if hints:
            lowered = [h.lower() for h in hints]
            for entry in feed.entries:
                blob = " ".join(_entry_urls(entry) + [entry.get("title") or ""]).lower()
                if any(h in blob for h in lowered if h):
                    return entry

        looks_like_feed = bool(
            RSS_REGEX.search(requested_url)
            or requested_url.endswith(".xml")
            or "/feed" in requested_url
            or requested_url.rstrip("/").endswith("rss")
        )
        if looks_like_feed:
            titles = []
            for entry in feed.entries[:5]:
                titles.append(f"- {entry.get('title', 'untitled')} ({entry.get('link') or 'no permalink'})")
            listing = "\n".join(titles) if titles else "(no entries)"
            raise ValueError(
                "This looks like an RSS feed URL, not a specific episode. "
                "Pass an episode permalink, enclosure MP3, or ?episode=<guid|title>. "
                f"Recent entries:\n{listing}"
            )

        raise ValueError(
            "Could not identify the requested episode in this RSS feed. "
            "Pass a specific episode permalink, enclosure URL, or ?episode=<guid|title>."
        )

    async def _fetch_rss_meta(self, feed_url: str) -> Optional[MediaMetadata]:
        def _parse():
            feed = feedparser.parse(feed_url)
            if not feed.entries:
                return None
            entry = self._select_rss_entry(feed, feed_url)
            show_title = feed.feed.get("title", "Podcast Show")
            ep_title = entry.get("title", "Episode")
            author = feed.feed.get("author", "Podcast Host")
            image = feed.feed.get("image", {}).get("href")
            audio_url = None
            for enc in entry.get("enclosures", []):
                href = enc.get("href") or ""
                if "audio" in enc.get("type", "") or href.lower().endswith((".mp3", ".m4a", ".ogg", ".wav")):
                    audio_url = href
                    break
            if not audio_url:
                raise ValueError(f"Episode '{ep_title}' has no audio enclosure.")
            return MediaMetadata(
                title=f"{show_title}: {ep_title}",
                author=author,
                thumbnail_url=image,
                platform="podcast",
                url=audio_url,
                description=(entry.get("summary") or "")[:500]
            )
        return await asyncio.to_thread(_parse)

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        self._reject_spotify(url)
        metadata = await self.extract_metadata(url)
        resolved_audio_url = metadata.url or url
        parsed = urlparse(resolved_audio_url)
        if "spotify.com" in (parsed.netloc or ""):
            raise ValueError(SPOTIFY_DRM_MSG)

        temp_audio = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True, **httpx_proxy_kw()) as client:
            try:
                async with client.stream("GET", resolved_audio_url) as response:
                    content_type = (response.headers.get("content-type") or "").lower()
                    if response.status_code == 200 and (
                        "audio" in content_type
                        or "octet-stream" in content_type
                        or re.search(r'\.(mp3|m4a|wav|ogg|aac|flac)(\?|$)', resolved_audio_url, re.I)
                    ):
                        if "html" in content_type:
                            raise ValueError(
                                f"URL returned HTML, not audio ({resolved_audio_url}). "
                                "Spotify/web pages cannot be fetched as MP3."
                            )
                        with open(temp_audio, "wb") as f:
                            async for chunk in response.aiter_bytes(chunk_size=1024 * 64):
                                f.write(chunk)
                    else:
                        await self._download_with_ytdlp(resolved_audio_url, temp_audio)
            except ValueError:
                raise
            except Exception:
                await self._download_with_ytdlp(resolved_audio_url, temp_audio)

        try:
            actual_file = temp_audio if os.path.exists(temp_audio) else temp_audio + ".mp3"
            if not os.path.exists(actual_file) or os.path.getsize(actual_file) < 64:
                raise RuntimeError("Failed to download audio for transcription.")
            with open(actual_file, "rb") as fh:
                head = fh.read(64).lstrip().lower()
            if head.startswith(b"<!doctype") or head.startswith(b"<html") or (head.startswith(b"{") and b"spotify" in head):
                raise ValueError("Downloaded file is a web page, not audio. Spotify DRM and HTML URLs are not supported.")
            full_text, segments = await transcriber.transcribe_audio_file(actual_file, language=language)
            return TranscriptResponse(
                metadata=metadata,
                language=language,
                full_text=full_text,
                segments=segments,
                source_type="podcast_whisper_ai",
                word_count=len(full_text.split())
            )
        finally:
            for p in [temp_audio, temp_audio + ".mp3"]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    async def _download_with_ytdlp(self, url: str, output_path: str):
        if "spotify.com" in url:
            raise ValueError(SPOTIFY_DRM_MSG)
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path.replace(".mp3", ""),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '64',
            }],
            'quiet': True,
            'no_warnings': True,
            **ytdlp_proxy_opts(),
        }
        def _exec():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        await asyncio.to_thread(_exec)


podcast_parser = PodcastParser()
