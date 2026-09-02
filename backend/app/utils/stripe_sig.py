"""Verify Stripe-Signature without adding the Stripe SDK to the backend."""
import hashlib
import hmac
import time


def verify_stripe_signature(payload: bytes, header: str, secret: str, tolerance: int = 300) -> bool:
    if not header or not secret:
        return False
    parsed: dict[str, list[str]] = {}
    for part in header.split(","):
        key, _, value = part.strip().partition("=")
        parsed.setdefault(key, []).append(value)
    timestamp = (parsed.get("t") or [None])[0]
    signatures = parsed.get("v1") or []
    if not timestamp or not signatures:
        return False
    try:
        ts = int(timestamp)
    except ValueError:
        return False
    if abs(time.time() - ts) > tolerance:
        return False
    signed = f"{timestamp}.".encode("utf-8") + payload
    expected = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, sig) for sig in signatures)
