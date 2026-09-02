import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "PolyTranscript"

    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert data["status"] == "ok"
    assert "YouTube" in data["platforms_supported"][0]
    assert "local_whisper_engine" in data["ai_providers"]
    assert isinstance(data["ai_providers"]["local_whisper_engine"], bool)


def test_sponsor_endpoint():
    res = client.get("/api/v1/sponsor")
    assert res.status_code == 200
    data = res.json()
    assert data["enabled"] is True
    assert "polytranscript.dev" not in (data.get("link") or "")


def test_generate_free_api_key():
    res = client.post("/api/v1/keys/generate?tier=free")
    assert res.status_code == 200
    data = res.json()
    assert data["tier"] == "free"
    assert data["key"].startswith("poly_free_")
    assert data["monthly_limit"] > 0
