import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App Info
    APP_NAME: str = "PolyTranscript"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    APP_URL: str = os.getenv("APP_URL", "https://polytranscript.com")

    # AI API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", "")
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY", "")

    # AI Model Defaults
    DEFAULT_LLM_MODEL: str = "gpt-4o-mini"
    DEFAULT_FAST_LLM_MODEL: str = "llama-3.3-70b-versatile"
    DEFAULT_WHISPER_MODEL: str = "whisper-large-v3"
    # If True, try openai-whisper / faster-whisper locally when cloud keys are absent.
    # Mock/demo transcripts are never returned regardless of this flag.
    LOCAL_WHISPER_FALLBACK: bool = True

    # Proxy Configuration (passed into youtube-transcript-api + yt-dlp)
    HTTP_PROXY: Optional[str] = os.getenv("HTTP_PROXY", None)
    HTTPS_PROXY: Optional[str] = os.getenv("HTTPS_PROXY", None)

    # Monetization & Rate Limiting Settings
    DEFAULT_FREE_DAILY_LIMIT: int = 15
    STARTER_MONTHLY_LIMIT: int = 500
    PRO_MONTHLY_LIMIT: int = 3000
    SCALE_MONTHLY_LIMIT: int = 15000

    # Sponsor Banner — keep on the live site, never polytranscript.dev (that host 500s)
    SPONSOR_ENABLED: bool = True
    SPONSOR_TEXT: str = "🚀 Sponsor this slot — Reach 100K+ AI builders & researchers monthly"
    SPONSOR_LINK: str = os.getenv("SPONSOR_LINK", "/pricing#sponsor")
    SPONSOR_BADGE: str = "Featured Sponsor"

    # Storage
    TEMP_STORAGE_DIR: str = os.getenv("TEMP_STORAGE_DIR", "/tmp/polytranscript")
    DATA_DIR: str = os.getenv("DATA_DIR", "/tmp/polytranscript/data")
    API_KEYS_PATH: str = os.getenv("API_KEYS_PATH", "")

    # CORS. Wildcard + credentials is invalid; default to explicit origins.
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://polytranscript.com",
        "https://www.polytranscript.com",
    ]

    # Billing — never invent live Stripe keys. Operator must set these.
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_SECRET_KEY: Optional[str] = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PRICE_STARTER_MONTHLY: Optional[str] = os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "")
    STRIPE_PRICE_STARTER_YEARLY: Optional[str] = os.getenv("STRIPE_PRICE_STARTER_YEARLY", "")
    STRIPE_PRICE_PRO_MONTHLY: Optional[str] = os.getenv("STRIPE_PRICE_PRO_MONTHLY", "")
    STRIPE_PRICE_PRO_YEARLY: Optional[str] = os.getenv("STRIPE_PRICE_PRO_YEARLY", "")
    STRIPE_PRICE_SCALE_MONTHLY: Optional[str] = os.getenv("STRIPE_PRICE_SCALE_MONTHLY", "")
    STRIPE_PRICE_SCALE_YEARLY: Optional[str] = os.getenv("STRIPE_PRICE_SCALE_YEARLY", "")
    STRIPE_PRICE_SPONSOR: Optional[str] = os.getenv("STRIPE_PRICE_SPONSOR", "")


settings = Settings()
if not settings.API_KEYS_PATH:
    settings.API_KEYS_PATH = os.path.join(settings.DATA_DIR, "api_keys.json")
os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
