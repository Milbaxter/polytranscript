import hmac
import time
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Request, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse

from app.config import settings
from app.models import (
    TranscribeRequest, TranscriptResponse,
    SearchResponse, ChatRequest, ChatResponse, HealthResponse, SponsorInfo,
    APIKeyInfo, KeyFulfillRequest
)
from app.parsers.universal import universal_parser
from app.parsers.youtube import youtube_parser
from app.ai.chapterer import chapter_generator
from app.ai.summarizer import summarizer
from app.ai.searcher import searcher
from app.ai.chat import chat_engine
from app.ai.transcriber import local_whisper_available
from app.utils.formatters import format_srt, format_vtt, format_markdown, format_llm_prompt
from app.utils.auth import verify_api_key, generate_new_api_key, PAID_TIERS
from app.utils import key_store, jobs as job_store
from app.utils.stripe_sig import verify_stripe_signature

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-platform transcript and audio intelligence API with AI chaptering, keyword soundbite search, and MCP.",
    docs_url="/docs",
    redoc_url="/redoc"
)

_origins = list(settings.CORS_ORIGINS or [])
_wildcard = any(o.strip() == "*" for o in _origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _wildcard else _origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _apply_intelligence(transcript: TranscriptResponse, include_chapters: bool, include_summary: bool) -> TranscriptResponse:
    if include_chapters and transcript.segments:
        transcript.chapters = await chapter_generator.generate_chapters(
            transcript.segments,
            transcript.full_text
        )
    if include_summary and transcript.full_text:
        transcript.summary = await summarizer.generate_summary(transcript)
    return transcript


async def _run_transcription_job(job_id: str) -> None:
    payload = job_store.get_payload(job_id) or {}
    job_store.set_status(job_id, "running")
    start_time = time.time()
    try:
        transcript = await universal_parser.extract_transcript(
            url=payload.get("url"),
            language=payload.get("language") or "en",
        )
        transcript = await _apply_intelligence(
            transcript,
            include_chapters=bool(payload.get("include_chapters", True)),
            include_summary=bool(payload.get("include_summary", True)),
        )
        transcript.processing_time_ms = round((time.time() - start_time) * 1000, 2)
        job_store.set_status(job_id, "completed", result=transcript.model_dump())
    except Exception as exc:
        job_store.set_status(job_id, "failed", error=str(exc))


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
        platforms_supported=["YouTube", "TikTok", "Podcasts (Apple, RSS)", "Direct Audio URLs", "File Upload"],
        ai_providers={
            "groq_whisper": bool(settings.GROQ_API_KEY),
            "openai_whisper": bool(settings.OPENAI_API_KEY),
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "local_whisper_engine": local_whisper_available(),
        },
        timestamp=datetime.now(timezone.utc).isoformat()
    )


@app.get("/api/v1/sponsor", response_model=SponsorInfo, tags=["Monetization"])
async def get_sponsor_info():
    return SponsorInfo(
        enabled=settings.SPONSOR_ENABLED,
        text=settings.SPONSOR_TEXT,
        link=settings.SPONSOR_LINK,
        badge=settings.SPONSOR_BADGE
    )


@app.post("/api/v1/keys/generate", response_model=APIKeyInfo, tags=["Monetization"])
async def generate_api_key(tier: str = Query("free", enum=["free", "starter", "pro", "scale"])):
    """Generate a free developer API key. Paid tiers are minted only by Stripe webhook fulfillment."""
    return generate_new_api_key(tier)


@app.post("/api/v1/keys/fulfill", response_model=APIKeyInfo, tags=["Monetization"])
async def fulfill_paid_key(
    body: KeyFulfillRequest,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
):
    """Mint a paid key after Stripe checkout. Requires X-Webhook-Secret == STRIPE_WEBHOOK_SECRET."""
    expected = settings.STRIPE_WEBHOOK_SECRET or ""
    if not expected:
        raise HTTPException(status_code=503, detail="STRIPE_WEBHOOK_SECRET is not configured.")
    if not x_webhook_secret or not hmac.compare_digest(x_webhook_secret, expected):
        raise HTTPException(status_code=401, detail="Invalid webhook secret.")
    existing = key_store.get_by_session(body.stripe_session_id)
    if existing:
        return existing
    return generate_new_api_key(
        body.tier,
        paid_verified=True,
        stripe_session_id=body.stripe_session_id,
        customer_email=body.customer_email,
    )


@app.get("/api/v1/keys/by-session/{session_id}", response_model=APIKeyInfo, tags=["Monetization"])
async def key_by_session(session_id: str):
    info = key_store.get_by_session(session_id)
    if not info:
        raise HTTPException(status_code=404, detail="No key issued for this checkout session yet. Wait for the Stripe webhook.")
    return info


@app.post("/api/v1/webhooks/stripe", tags=["Monetization"])
async def stripe_webhook(request: Request):
    secret = settings.STRIPE_WEBHOOK_SECRET or ""
    if not secret:
        raise HTTPException(status_code=503, detail="STRIPE_WEBHOOK_SECRET is not configured.")
    payload = await request.body()
    header = request.headers.get("stripe-signature") or ""
    if not verify_stripe_signature(payload, header, secret):
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.")
    import json
    try:
        event = json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")
    if event.get("type") == "checkout.session.completed":
        session = event.get("data", {}).get("object") or {}
        metadata = session.get("metadata") or {}
        tier = metadata.get("tier") or "starter"
        if tier not in PAID_TIERS:
            tier = "starter"
        session_id = session.get("id")
        email = session.get("customer_email") or (session.get("customer_details") or {}).get("email")
        if session_id:
            existing = key_store.get_by_session(session_id)
            if not existing:
                generate_new_api_key(
                    tier,
                    paid_verified=True,
                    stripe_session_id=session_id,
                    customer_email=email,
                )
    return {"received": True}


@app.post("/api/v1/transcribe", tags=["Transcription"])
async def transcribe_media(
    request: TranscribeRequest,
    background_tasks: BackgroundTasks,
    api_key: Optional[APIKeyInfo] = Depends(verify_api_key),
):
    """YouTube captions return 200. Whisper/download returns 202 + job_id. Never canned demo copy."""
    start_time = time.time()
    try:
        if youtube_parser.can_handle(request.url):
            captions = await youtube_parser.extract_captions_only(
                request.url, language=request.language or "en"
            )
            if captions:
                captions = await _apply_intelligence(
                    captions, request.include_chapters, request.include_summary
                )
                captions.processing_time_ms = round((time.time() - start_time) * 1000, 2)
                return captions

        job = job_store.create_job(request.model_dump())
        background_tasks.add_task(_run_transcription_job, job["job_id"])
        return JSONResponse(
            {
                "job_id": job["job_id"],
                "status": "queued",
                "created_at": job["created_at"],
            },
            status_code=202,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(e)}")


@app.get("/api/v1/jobs/{job_id}", tags=["Transcription"])
async def get_job(job_id: str):
    rec = job_store.get_job(job_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Unknown job_id.")
    return rec


@app.post("/api/v1/upload", tags=["Transcription"])
async def upload_and_transcribe(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("en"),
    include_chapters: bool = Form(True),
    include_summary: bool = Form(True),
    api_key: Optional[APIKeyInfo] = Depends(verify_api_key),
):
    """Upload and transcribe local audio/video file (async job)."""
    temp_path = os.path.join(settings.TEMP_STORAGE_DIR, f"upload_{file.filename}")
    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    job = job_store.create_job({
        "url": temp_path,
        "language": language,
        "include_chapters": include_chapters,
        "include_summary": include_summary,
        "source": "upload",
    })
    background_tasks.add_task(_run_transcription_job, job["job_id"])
    return JSONResponse(
        {"job_id": job["job_id"], "status": "queued", "created_at": job["created_at"]},
        status_code=202,
    )


@app.post("/api/v1/search", response_model=SearchResponse, tags=["AI Intelligence"])
async def search_transcript(body: dict):
    """Keyword/token-overlap search (not embedding semantic search) over provided segments."""
    from app.models import TranscriptSegment
    query = body.get("query") or ""
    raw_segments = body.get("segments") or []
    segs = [TranscriptSegment(**s) for s in raw_segments]
    return searcher.search(segs, query)


@app.post("/api/v1/chat", response_model=ChatResponse, tags=["AI Intelligence"])
async def chat_with_media(request: ChatRequest):
    full_text = request.transcript_text or ""
    segments = list(request.segments or [])
    if request.url and not full_text:
        t = await universal_parser.extract_transcript(request.url)
        full_text = t.full_text
        segments = t.segments
    return await chat_engine.answer_question(request.question, full_text, segments)


@app.post("/api/v1/export/{format_type}", tags=["Export"])
async def export_transcript(
    format_type: str,
    transcript: TranscriptResponse
):
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
