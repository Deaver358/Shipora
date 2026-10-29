"""
Small Redis-backed rate limiter for the auth endpoints (brute-force and
email-spam protection). If Redis is unavailable requests are allowed, so
an outage never locks users out.
"""
import logging

from fastapi import HTTPException, Request, status

from .redis import redis_client, REDIS_UNAVAILABLE_ERRORS

logger = logging.getLogger("shipora.ratelimit")


async def _hit(key: str, limit: int, window_seconds: int) -> bool:
    try:
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, window_seconds)
        return count <= limit
    except REDIS_UNAVAILABLE_ERRORS as exc:
        logger.warning("Rate limiter skipped (Redis unavailable): %s", exc)
        return True


def client_ip(request: Request) -> str:
    # With uvicorn --proxy-headers this is the real client IP
    return request.client.host if request.client else "unknown"


async def enforce(request: Request, scope: str, limit: int, window_seconds: int, identity: str = "") -> None:
    key = f"rl:{scope}:{client_ip(request)}:{(identity or '').strip().lower()}"
    if not await _hit(key, limit, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a few minutes and try again.",
        )
