"""P0 tests: no demo transcripts; unverified requests cannot mint Pro keys."""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai.transcriber import AudioTranscriber, DEMO_FORBIDDEN_SNIPPETS
from app.config import settings
from app.parsers.podcast import podcast_parser
from app.parsers.youtube import youtube_parser
from app.utils.proxy import ytdlp_proxy_opts

client = TestClient(app)

DEMO_SENTENCES = list(DEMO_FORBIDDEN_SNIPPETS) + [
    "This transcript was extracted and processed via PolyTranscript multi-platform intelligence",
    "Welcome to this episode. Today we are breaking down multi-platform media intelligence",
]


def test_forged_poly_prefix_is_not_pro():
    res = client.post(
        "/api/v1/transcribe",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "include_chapters": False, "include_summary": False},
        headers={"X-API-Key": "poly_pro_forgedkey123456"},
    )
    assert res.status_code == 401
    body = res.json()
    assert "detail" in body
    blob = str(body).lower()
    for snippet in DEMO_SENTENCES:
        assert snippet.lower() not in blob


@pytest.mark.parametrize("tier", ["starter", "pro", "scale"])
def test_cannot_mint_paid_key_without_webhook(tier):
    res = client.post(f"/api/v1/keys/generate?tier={tier}")
    assert res.status_code == 403
    data = res.json()
    assert "detail" in data
    assert "poly_pro_" not in str(data.get("key") or "")


def test_fulfill_rejects_missing_or_wrong_secret(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_test_secret")
    monkeypatch.setattr(settings, "API_KEYS_PATH", str(tmp_path / "keys.json"))
    res = client.post(
        "/api/v1/keys/fulfill",
        json={"stripe_session_id": "cs_test_abc", "tier": "pro"},
    )
    assert res.status_code == 401

    res = client.post(
        "/api/v1/keys/fulfill",
        json={"stripe_session_id": "cs_test_abc", "tier": "pro"},
        headers={"X-Webhook-Secret": "wrong"},
    )
    assert res.status_code == 401


def test_fulfill_with_secret_mints_pro_and_lookup(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_test_secret")
    monkeypatch.setattr(settings, "API_KEYS_PATH", str(tmp_path / "keys.json"))
    (tmp_path / "keys.json").write_text('{"keys":{},"by_session":{}}')

    res = client.post(
        "/api/v1/keys/fulfill",
        json={"stripe_session_id": "cs_test_lookup", "tier": "pro", "customer_email": "a@b.c"},
        headers={"X-Webhook-Secret": "whsec_test_secret"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["tier"] == "pro"
    assert data["key"].startswith("poly_pro_")
    assert data["active"] is True

    lookup = client.get("/api/v1/keys/by-session/cs_test_lookup")
    assert lookup.status_code == 200
    assert lookup.json()["key"] == data["key"]

    res2 = client.post(
        "/api/v1/keys/fulfill",
        json={"stripe_session_id": "cs_test_lookup", "tier": "pro"},
        headers={"X-Webhook-Secret": "whsec_test_secret"},
    )
    assert res2.json()["key"] == data["key"]


def test_transcriber_never_returns_demo_sentences(tmp_path, monkeypatch):
    t = AudioTranscriber()
    t.groq_api_key = ""
    t.openai_api_key = ""
    monkeypatch.setattr("app.ai.transcriber.settings.LOCAL_WHISPER_FALLBACK", False)
    monkeypatch.setattr("app.ai.transcriber.local_whisper_available", lambda: False)
    audio = tmp_path / "silence.mp3"
    audio.write_bytes(b"ID3fake")
    monkeypatch.setattr(t, "_preprocess_audio", lambda p: str(audio))

    with pytest.raises(RuntimeError) as ei:
        asyncio.run(t.transcribe_audio_file(str(audio)))
    err = str(ei.value)
    for snippet in DEMO_SENTENCES:
        assert snippet.lower() not in err.lower()
    assert "demo" in err.lower() or "GROQ_API_KEY" in err or "provider" in err.lower()


def test_spotify_is_rejected_as_drm():
    url = "https://open.spotify.com/episode/7makk4oTQel546B6mAzWCO"
    assert podcast_parser.can_handle(url)
    with pytest.raises(ValueError) as ei:
        asyncio.run(podcast_parser.extract_metadata(url))
    assert "DRM" in str(ei.value)


def test_rss_selects_requested_episode_not_first():
    import feedparser
    rss = (
        '<?xml version="1.0"?>'
        "<rss version=\"2.0\"><channel>"
        "<title>Demo Show</title>"
        "<item><title>Episode One</title><guid>ep-1</guid>"
        "<link>https://example.com/ep1</link>"
        "<enclosure url=\"https://example.com/ep1.mp3\" type=\"audio/mpeg\"/></item>"
        "<item><title>Episode Two</title><guid>ep-2</guid>"
        "<link>https://example.com/ep2</link>"
        "<enclosure url=\"https://example.com/ep2.mp3\" type=\"audio/mpeg\"/></item>"
        "</channel></rss>"
    )
    feed = feedparser.parse(rss)
    with pytest.raises(ValueError) as ei:
        podcast_parser._select_rss_entry(feed, "https://example.com/feed.xml")
    msg = str(ei.value).lower()
    assert "episode" in msg or "permalink" in msg

    chosen = podcast_parser._select_rss_entry(feed, "https://example.com/ep2")
    assert chosen.get("title") == "Episode Two"

    chosen2 = podcast_parser._select_rss_entry(feed, "https://example.com/feed.xml?episode=ep-1")
    assert chosen2.get("title") == "Episode One"


def test_ytdlp_proxy_opts_honor_http_proxy(monkeypatch):
    monkeypatch.setattr(settings, "HTTP_PROXY", "http://127.0.0.1:8888")
    monkeypatch.setattr(settings, "HTTPS_PROXY", None)
    opts = ytdlp_proxy_opts()
    assert opts.get("proxy") == "http://127.0.0.1:8888"


def test_youtube_captions_method_exists():
    assert hasattr(youtube_parser, "extract_captions_only")
