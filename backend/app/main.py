import time
import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse

from app.config import settings
from app.models import (
    TranscribeRequest, TranscriptResponse, Chapter, SummaryResponse,
    SearchResponse, ChatRequest, ChatResponse, HealthResponse, SponsorInfo,
    APIKeyInfo, MediaMetadata
)
from app.parsers.universal import universal_parser
from app.parsers.audio_file import audio_file_parser
from app.ai.chapterer import chapter_generator
from app.ai.summarizer import summarizer
from app.ai.searcher import searcher
from app.ai.chat import chat_engine
from app.utils.formatters import format_srt, format_vtt, format_markdown, format_llm_prompt
from app.utils.auth import verify_api_key, generate_new_api_key, API_KEYS_DB

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-platform transcript & audio intelligence API (YouTube + TikTok + Podcasts) with AI chaptering, semantic soundbite search, and Model Context Protocol (MCP) server.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Next.js frontend and external developer access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "mcp_ready": True,
        "supported_platforms": ["youtube", "tiktok", "podcast", "direct_audio", "file_upload"]
    }

@app.get("/api/v1/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        platforms_supported=["YouTube", "TikTok", "Podcasts (Apple, Spotify, RSS)", "Direct Audio URLs", "File Upload"],
        ai_providers={
            "groq_whisper": bool(settings.GROQ_API_KEY),
            "openai_whisper": bool(settings.OPENAI_API_KEY),
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "local_whisper_engine": True
        },
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.get("/api/v1/sponsor", response_model=SponsorInfo, tags=["Monetization"])
async def get_sponsor_info():
    """Return active sponsor slot info (Replicating YouTubeToTranscript's $11k/mo ad banner)."""
    return SponsorInfo(
        enabled=settings.SPONSOR_ENABLED,
        text=settings.SPONSOR_TEXT,
        link=settings.SPONSOR_LINK,
        badge=settings.SPONSOR_BADGE
    )

@app.post("/api/v1/keys/generate", response_model=APIKeyInfo, tags=["Monetization"])
async def generate_api_key(tier: str = Query("starter", enum=["free", "starter", "pro", "scale"])):
    """Generate a new developer API key."""
    return generate_new_api_key(tier)

@app.post("/api/v1/transcribe", response_model=TranscriptResponse, tags=["Transcription"])
async def transcribe_media(
    request: TranscribeRequest,
    api_key: Optional[APIKeyInfo] = Depends(verify_api_key)
):
    """
    Transcribe any YouTube, TikTok, Podcast, or Audio URL into timestamped text,
    with automatic AI chaptering and executive summary.
    """
    start_time = time.time()
    try:
        # 1. Parse and extract transcript
        transcript = await universal_parser.extract_transcript(
            url=request.url,
            language=request.language or "en"
        )

        # 2. AI Chaptering (if requested)
        if request.include_chapters and transcript.segments:
            transcript.chapters = await chapter_generator.generate_chapters(
                transcript.segments,
                transcript.full_text
            )

        # 3. AI Summary (if requested)
        if request.include_summary and transcript.full_text:
            transcript.summary = await summarizer.generate_summary(transcript)

        # 4. Processing metrics
        transcript.processing_time_ms = round((time.time() - start_time) * 1000, 2)
        return transcript

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transcription failed: {str(e)}")

@app.post("/api/v1/upload", response_model=TranscriptResponse, tags=["Transcription"])
async def upload_and_transcribe(
    file: UploadFile = File(...),
    language: str = Form("en"),
    include_chapters: bool = Form(True),
    include_summary: bool = Form(True),
    api_key: Optional[APIKeyInfo] = Depends(verify_api_key)
):
    """Upload and transcribe local audio/video file."""
    start_time = time.time()
    temp_path = os.path.join(settings.TEMP_STORAGE_DIR, f"upload_{file.filename}")
    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        transcript = await audio_file_parser.extract_transcript(temp_path, language=language)

        if include_chapters and transcript.segments:
            transcript.chapters = await chapter_generator.generate_chapters(transcript.segments, transcript.full_text)

        if include_summary and transcript.full_text:
            transcript.summary = await summarizer.generate_summary(transcript)

        transcript.processing_time_ms = round((time.time() - start_time) * 1000, 2)
        return transcript
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/api/v1/search", response_model=SearchResponse, tags=["AI Intelligence"])
async def search_transcript(
    query: str = Query(..., description="Query phrase or keywords to find in audio"),
    segments: List[dict] = Form(None)
):
    """Search for exact soundbites and timestamp moments within transcript segments."""
    from app.models import TranscriptSegment
    segs = [TranscriptSegment(**s) for s in segments] if segments else []
    return searcher.search(segs, query)

@app.post("/api/v1/chat", response_model=ChatResponse, tags=["AI Intelligence"])
async def chat_with_media(request: ChatRequest):
    """Ask questions directly grounded on the video/podcast transcript with timestamp citations."""
    from app.models import TranscriptSegment
    # If URL provided, transcribe first or use provided text
    full_text = request.transcript_text or ""
    segments = []
    if request.url:
        t = await universal_parser.extract_transcript(request.url)
        full_text = t.full_text
        segments = t.segments

    return await chat_engine.answer_question(request.question, full_text, segments)

@app.post("/api/v1/export/{format_type}", tags=["Export"])
async def export_transcript(
    format_type: str,
    transcript: TranscriptResponse
):
    """Export transcript to Markdown, SRT, VTT, LLM Prompt, or JSON."""
    fmt = format_type.lower()
    if fmt == "srt":
        return PlainTextResponse(format_srt(transcript.segments), media_type="text/plain")
    elif fmt == "vtt":
        return PlainTextResponse(format_vtt(transcript.segments), media_type="text/vtt")
    elif fmt in ["md", "markdown"]:
        return PlainTextResponse(format_markdown(transcript), media_type="text/markdown")
    elif fmt == "prompt":
        return PlainTextResponse(format_llm_prompt(transcript), media_type="text/plain")
    elif fmt == "json":
        return JSONResponse(transcript.model_dump())
    else:
        return PlainTextResponse(transcript.full_text, media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
