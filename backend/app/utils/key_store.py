"""JSON-file API key store. Swap the backend of this module for SQLite later."""
from __future__ import annotations

import fcntl
import json
import os
from datetime import datetime, timezone
from typing import Dict, Optional

from app.config import settings
from app.models import APIKeyInfo


def _limits() -> Dict[str, int]:
    return {
        "free": 50,
        "starter": settings.STARTER_MONTHLY_LIMIT,
        "pro": settings.PRO_MONTHLY_LIMIT,
        "scale": settings.SCALE_MONTHLY_LIMIT,
        "enterprise": 100000,
    }


def _path() -> str:
    os.makedirs(os.path.dirname(settings.API_KEYS_PATH) or ".", exist_ok=True)
    return settings.API_KEYS_PATH


def _empty() -> dict:
    return {"keys": {}, "by_session": {}}


def _load_unlocked(fh) -> dict:
    fh.seek(0)
    raw = fh.read()
    if not raw:
        return _empty()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return _empty()
    data.setdefault("keys", {})
    data.setdefault("by_session", {})
    return data


def _save_unlocked(fh, data: dict) -> None:
    fh.seek(0)
    fh.truncate()
    json.dump(data, fh, indent=2)
    fh.flush()
    os.fsync(fh.fileno())


def _with_lock(write: bool):
    path = _path()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    mode = "r+" if os.path.exists(path) else "w+"
    fh = open(path, mode)
    fcntl.flock(fh, fcntl.LOCK_EX if write else fcntl.LOCK_SH)
    if os.path.getsize(path) == 0:
        data = _empty()
        if write:
            _save_unlocked(fh, data)
    else:
        data = _load_unlocked(fh)
    return fh, data


def get_key(key: str) -> Optional[APIKeyInfo]:
    fh, data = _with_lock(False)
    try:
        rec = data["keys"].get(key)
        if not rec:
            return None
        return APIKeyInfo(**{k: rec[k] for k in APIKeyInfo.model_fields if k in rec})
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def get_by_session(session_id: str) -> Optional[APIKeyInfo]:
    fh, data = _with_lock(False)
    try:
        key = data["by_session"].get(session_id)
        if not key:
            return None
        rec = data["keys"].get(key)
        if not rec:
            return None
        return APIKeyInfo(**{k: rec[k] for k in APIKeyInfo.model_fields if k in rec})
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def put_key(info: APIKeyInfo) -> APIKeyInfo:
    fh, data = _with_lock(True)
    try:
        rec = info.model_dump()
        data["keys"][info.key] = rec
        if info.stripe_session_id:
            data["by_session"][info.stripe_session_id] = info.key
        _save_unlocked(fh, data)
        return info
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def increment_usage(key: str) -> Optional[APIKeyInfo]:
    fh, data = _with_lock(True)
    try:
        rec = data["keys"].get(key)
        if not rec:
            return None
        rec["used_this_month"] = int(rec.get("used_this_month") or 0) + 1
        rec["last_used_at"] = datetime.now(timezone.utc).isoformat()
        data["keys"][key] = rec
        _save_unlocked(fh, data)
        return APIKeyInfo(**{k: rec[k] for k in APIKeyInfo.model_fields if k in rec})
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def mint_key(tier: str, stripe_session_id: Optional[str] = None, customer_email: Optional[str] = None) -> APIKeyInfo:
    import uuid

    limits = _limits()
    new_key = f"poly_{tier}_{uuid.uuid4().hex[:16]}"
    info = APIKeyInfo(
        key=new_key,
        tier=tier,  # type: ignore[arg-type]
        monthly_limit=limits.get(tier, 50),
        used_this_month=0,
        active=True,
        stripe_session_id=stripe_session_id,
        customer_email=customer_email,
    )
    return put_key(info)
