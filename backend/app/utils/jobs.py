"""In-process transcription job store. Upgrade to Redis/SQLite if you add workers."""
from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_lock = threading.Lock()
_JOBS: Dict[str, Dict[str, Any]] = {}


def create_job(payload: dict) -> dict:
    job_id = uuid.uuid4().hex
    rec = {
        "job_id": job_id,
        "status": "queued",
        "payload": payload,
        "error": None,
        "result": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _JOBS[job_id] = rec
    return dict(rec)


def get_job(job_id: str) -> Optional[dict]:
    with _lock:
        rec = _JOBS.get(job_id)
        if not rec:
            return None
        return {
            "job_id": rec["job_id"],
            "status": rec["status"],
            "error": rec["error"],
            "result": rec["result"],
            "created_at": rec["created_at"],
        }


def get_payload(job_id: str) -> Optional[dict]:
    with _lock:
        rec = _JOBS.get(job_id)
        return rec["payload"] if rec else None


def set_status(job_id: str, status: str, error: Optional[str] = None, result: Optional[dict] = None) -> None:
    with _lock:
        rec = _JOBS.get(job_id)
        if not rec:
            return
        rec["status"] = status
        if error is not None:
            rec["error"] = error
        if result is not None:
            rec["result"] = result
