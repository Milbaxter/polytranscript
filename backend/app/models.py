from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

PlatformType = Literal["youtube", "tiktok", "podcast", "direct_audio", "file_upload", "unknown"]


class TranscriptSegment(BaseModel):
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    text: str = Field(..., description="Transcribed text content")
    speaker: Optional[str] = Field(None, description="Identified speaker name or ID")

    @property
    def formatted_start(self) -> str:
        mins, secs = divmod(int(self.start), 60)
        hours, mins = divmod(mins, 60)
        if hours > 0:
            return f"{hours:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"


class MediaMetadata(BaseModel):
    title: str = "Untitled Media"
    author: str = "Unknown Author"
    duration_seconds: Optional[float] = None
    thumbnail_url: Optional[str] = None
    view_count: Optional[int] = None
    upload_date: Optional[str] = None
    platform: PlatformType = "unknown"
    url: str = ""
    description: Optional[str] = None


class Chapter(BaseModel):
    start: float
    end: float
    title: str
    summary: str
    key_points: List[str] = []

    @property
    def formatted_start(self) -> str:
        mins, secs = divmod(int(self.start), 60)
        hours, mins = divmod(mins, 60)
        if hours > 0:
            return f"{hours:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"


class SummaryResponse(BaseModel):
    tldr: str
    key_takeaways: List[str] = []
    action_items: List[str] = []
    soundbites: List[str] = []
    social_post: Optional[str] = None


class SearchHit(BaseModel):
    segment_index: int
    start: float
    end: float
    text: str
    score: float
    formatted_start: str


class SearchResponse(BaseModel):
    query: str
    total_matches: int
    hits: List[SearchHit]
    method: str = Field(
        default="keyword_overlap",
        description="Search is token/phrase overlap, not embedding-based semantic search.",
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    url: Optional[str] = None
    transcript_text: Optional[str] = None
    question: str
    history: List[ChatMessage] = []
    segments: List[TranscriptSegment] = []


class ChatResponse(BaseModel):
    answer: str
    relevant_timestamps: List[Dict[str, Any]] = []


class TranscribeRequest(BaseModel):
    url: str = Field(..., description="URL to YouTube, TikTok, Podcast RSS/Episode, or Audio file")
    language: Optional[str] = Field("en", description="Target or source language code (e.g., 'en', 'auto')")
    include_chapters: bool = Field(True, description="Generate AI chapters automatically")
    include_summary: bool = Field(True, description="Generate AI summary automatically")
    output_format: Optional[str] = Field("json", description="Output format: json, srt, vtt, markdown, text")


class TranscriptResponse(BaseModel):
    metadata: MediaMetadata
    language: str
    full_text: str
    segments: List[TranscriptSegment] = []
    chapters: List[Chapter] = []
    summary: Optional[SummaryResponse] = None
    source_type: str = "auto"
    word_count: int = 0
    processing_time_ms: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "completed", "failed"]
    error: Optional[str] = None
    result: Optional[TranscriptResponse] = None
    created_at: Optional[str] = None


class SponsorInfo(BaseModel):
    enabled: bool = True
    text: str
    link: str
    badge: str


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    platforms_supported: List[str]
    ai_providers: Dict[str, bool]
    timestamp: str


class APIKeyInfo(BaseModel):
    key: str
    tier: Literal["free", "starter", "pro", "scale", "enterprise"]
    monthly_limit: int
    used_this_month: int
    active: bool
    stripe_session_id: Optional[str] = None
    customer_email: Optional[str] = None


class KeyFulfillRequest(BaseModel):
    stripe_session_id: str
    tier: Literal["starter", "pro", "scale", "enterprise"]
    customer_email: Optional[str] = None
