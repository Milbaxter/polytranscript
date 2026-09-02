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

    # AI API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", "")
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY", "")

    # AI Model Defaults
    DEFAULT_LLM_MODEL: str = "gpt-4o-mini"
    DEFAULT_FAST_LLM_MODEL: str = "llama-3.3-70b-versatile"
    DEFAULT_WHISPER_MODEL: str = "whisper-large-v3"
    LOCAL_WHISPER_FALLBACK: bool = True

    # Proxy Configuration (For high-volume scraping without 429 IP bans)
    HTTP_PROXY: Optional[str] = os.getenv("HTTP_PROXY", None)
    HTTPS_PROXY: Optional[str] = os.getenv("HTTPS_PROXY", None)

    # Monetization & Rate Limiting Settings
    DEFAULT_FREE_DAILY_LIMIT: int = 15
    STARTER_MONTHLY_LIMIT: int = 500
    PRO_MONTHLY_LIMIT: int = 3000
    SCALE_MONTHLY_LIMIT: int = 15000

    # Sponsor Banner Configuration (Replicating YouTubeToTranscript's $11k/mo ad slot model)
    SPONSOR_ENABLED: bool = True
    SPONSOR_TEXT: str = "🚀 Sponsor this slot — Reach 100K+ AI builders & researchers monthly"
    SPONSOR_LINK: str = "https://polytranscript.dev/pricing#sponsor"
    SPONSOR_BADGE: str = "Featured Sponsor"

    # Storage / Temp paths
    TEMP_STORAGE_DIR: str = "/tmp/polytranscript"

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
