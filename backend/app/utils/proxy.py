"""HTTP(S) proxy helpers shared by YouTube, TikTok, and podcast parsers."""
from typing import Any, Dict, Optional

from app.config import settings


def http_proxy_url() -> Optional[str]:
    """Return the first configured proxy URL (HTTP_PROXY, then HTTPS_PROXY)."""
    return (settings.HTTP_PROXY or settings.HTTPS_PROXY or None) or None


def ytdlp_proxy_opts() -> Dict[str, Any]:
    """yt-dlp option fragment that actually applies HTTP_PROXY."""
    proxy = http_proxy_url()
    if proxy:
        return {"proxy": proxy}
    return {}


def httpx_proxy_kw() -> Dict[str, Any]:
    proxy = http_proxy_url()
    if proxy:
        return {"proxy": proxy}
    return {}


def youtube_transcript_api_client():
    """YouTubeTranscriptApi wired to HTTP_PROXY via GenericProxyConfig when set."""
    from youtube_transcript_api import YouTubeTranscriptApi

    proxy = http_proxy_url()
    if not proxy:
        return YouTubeTranscriptApi()
    try:
        from youtube_transcript_api.proxies import GenericProxyConfig

        https = settings.HTTPS_PROXY or proxy
        return YouTubeTranscriptApi(
            proxy_config=GenericProxyConfig(http_url=proxy, https_url=https)
        )
    except Exception as exc:
        print(f"[proxy] Could not attach GenericProxyConfig ({exc}); continuing without proxy.")
        return YouTubeTranscriptApi()
