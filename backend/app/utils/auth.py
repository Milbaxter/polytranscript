from typing import Optional
from fastapi import Header, HTTPException, status
from app.config import settings
from app.models import APIKeyInfo
from app.utils.key_store import get_key, increment_usage, mint_key

PAID_TIERS = {"starter", "pro", "scale", "enterprise"}


async def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> Optional[APIKeyInfo]:
    """
    Validate API key from request headers against the persistent store.
    A missing key is treated as an anonymous free guest (rate-limited).
    Keys are NEVER auto-promoted to Pro based on a `poly_` prefix.
    """
    if not x_api_key:
        return APIKeyInfo(
            key="guest_anonymous",
            tier="free",
            monthly_limit=settings.DEFAULT_FREE_DAILY_LIMIT,
            used_this_month=0,
            active=True,
        )

    key_info = get_key(x_api_key)
    if not key_info or not key_info.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key. Generate a free key at /api-keys or complete Stripe checkout for a paid tier.",
        )

    if key_info.used_this_month >= key_info.monthly_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for tier '{key_info.tier}'. Upgrade at /pricing.",
        )

    return increment_usage(x_api_key) or key_info


def generate_new_api_key(
    tier: str = "free",
    *,
    paid_verified: bool = False,
    stripe_session_id: Optional[str] = None,
    customer_email: Optional[str] = None,
) -> APIKeyInfo:
    """Mint a key. Paid tiers require paid_verified=True (Stripe webhook/fulfill)."""
    if tier not in {"free", "starter", "pro", "scale", "enterprise"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown tier.")
    if tier in PAID_TIERS and not paid_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paid API keys are issued only after a verified Stripe checkout (webhook). Use tier=free or complete payment.",
        )
    return mint_key(
        tier=tier,
        stripe_session_id=stripe_session_id,
        customer_email=customer_email,
    )
