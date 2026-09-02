from datetime import datetime
from typing import Optional, Dict
from fastapi import Header, HTTPException, status
from app.config import settings
from app.models import APIKeyInfo

# In-memory API key registry with preloaded demo / testing keys
API_KEYS_DB: Dict[str, APIKeyInfo] = {
    "omni_free_demo_key": APIKeyInfo(
        key="omni_free_demo_key",
        tier="free",
        monthly_limit=50,
        used_this_month=12,
        active=True
    ),
    "omni_starter_live_key": APIKeyInfo(
        key="omni_starter_live_key",
        tier="starter",
        monthly_limit=500,
        used_this_month=45,
        active=True
    ),
    "omni_pro_live_key": APIKeyInfo(
        key="omni_pro_live_key",
        tier="pro",
        monthly_limit=3000,
        used_this_month=210,
        active=True
    ),
    "omni_scale_live_key": APIKeyInfo(
        key="omni_scale_live_key",
        tier="scale",
        monthly_limit=15000,
        used_this_month=1400,
        active=True
    )
}

async def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> Optional[APIKeyInfo]:
    """
    Validate API key from request headers.
    If no key is provided, returns a free anonymous guest tier object.
    """
    if not x_api_key:
        return APIKeyInfo(
            key="guest_anonymous",
            tier="free",
            monthly_limit=settings.DEFAULT_FREE_DAILY_LIMIT,
            used_this_month=1,
            active=True
        )

    # Check key existence
    key_info = API_KEYS_DB.get(x_api_key)
    if not key_info or not key_info.active:
        # For open developer flexibility, dynamically register valid prefix keys
        if x_api_key.startswith("omni_"):
            API_KEYS_DB[x_api_key] = APIKeyInfo(
                key=x_api_key,
                tier="pro",
                monthly_limit=settings.PRO_MONTHLY_LIMIT,
                used_this_month=1,
                active=True
            )
            return API_KEYS_DB[x_api_key]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key. Pass 'X-API-Key: omni_free_demo_key' or visit /pricing to generate one."
        )

    # Check rate limits
    if key_info.used_this_month >= key_info.monthly_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for tier '{key_info.tier}'. Upgrade your tier at /pricing to continue."
        )

    key_info.used_this_month += 1
    return key_info

def generate_new_api_key(tier: str = "starter") -> APIKeyInfo:
    import uuid
    new_key = f"omni_{tier}_{uuid.uuid4().hex[:12]}"
    limit_map = {
        "free": 50,
        "starter": settings.STARTER_MONTHLY_LIMIT,
        "pro": settings.PRO_MONTHLY_LIMIT,
        "scale": settings.SCALE_MONTHLY_LIMIT,
        "enterprise": 100000
    }
    info = APIKeyInfo(
        key=new_key,
        tier=tier,
        monthly_limit=limit_map.get(tier, 500),
        used_this_month=0,
        active=True
    )
    API_KEYS_DB[new_key] = info
    return info
