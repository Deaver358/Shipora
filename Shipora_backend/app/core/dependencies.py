from fastapi import Request, status, Depends
from fastapi.security import HTTPBearer
from fastapi.exceptions import HTTPException
from typing import Dict, Any, List
from ..utils.validators import decode_token
from ..utils.redis import get_access_token, token_in_blocklist, get_refresh_token, REDIS_UNAVAILABLE_ERRORS
from ..utils.config import settings
import asyncio
import logging
from app.models.user_model import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.session_config import session
from app.services.auth_services import AuthService
import json


auth_service = AuthService()
logger = logging.getLogger("shipora.auth")


def _load_stored(raw):
    """Redis returns bytes (or None when the key expired / was revoked)."""
    if raw is None:
        return None
    try:
        if isinstance(raw, (bytes, bytearray)):
            raw = raw.decode("utf-8")
        return json.loads(raw)
    except (ValueError, TypeError):
        return None


class _RedisUnavailable(Exception):
    pass


async def _redis_call(coro):
    try:
        return await coro
    except REDIS_UNAVAILABLE_ERRORS as exc:
        if settings.REDIS_FAIL_OPEN:
            logger.warning("Redis unavailable, falling back to JWT-only validation: %s", exc)
            raise _RedisUnavailable() from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable. Please try again.",
        )


class AccessTokenBearer(HTTPBearer):
    async def __call__(self, request: Request) -> Dict[str, Any]:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                detail="missing access token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        token_data = await asyncio.to_thread(decode_token, token)
        if token_data is None:
            raise HTTPException(
                detail="invalid access token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if token_data.get('refresh'):
            raise HTTPException(
                detail="access token required",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        uid = (token_data.get("user") or {}).get("uid")
        if not uid:
            raise HTTPException(
                detail="invalid access token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        try:
            if await _redis_call(token_in_blocklist(token)):
                raise HTTPException(
                    detail="token is blocked",
                    status_code=status.HTTP_403_FORBIDDEN
                )

            stored_token = _load_stored(await _redis_call(get_access_token(user_uid=uid)))
        except _RedisUnavailable:
            # Signature and expiry were already verified by decode_token().
            return token_data

        if stored_token is None:
            raise HTTPException(
                detail="access token expired",
                status_code=status.HTTP_403_FORBIDDEN
            )

        if stored_token != token_data:
            raise HTTPException(
                detail="access token revoked",
                status_code=status.HTTP_403_FORBIDDEN
            )

        return token_data


class RefreshTokenBearer(HTTPBearer):

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Dict[str, Any]:
        token = request.cookies.get("refresh_token")
        if not token:
            raise HTTPException(
                detail="missing refresh token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        token_data = await asyncio.to_thread(decode_token, token)
        if token_data is None:
            raise HTTPException(
                detail="invalid refresh token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not token_data.get('refresh'):
            raise HTTPException(
                detail="refresh token required",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        uid = (token_data.get("user") or {}).get("uid")
        if not uid:
            raise HTTPException(
                detail="invalid refresh token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        try:
            stored_token = _load_stored(await _redis_call(get_refresh_token(user_uid=uid)))
        except _RedisUnavailable:
            return token_data

        if stored_token is None:
            raise HTTPException(
                detail="refresh token expired",
                status_code=status.HTTP_403_FORBIDDEN
            )

        if stored_token != token_data:
            raise HTTPException(
                detail="refresh token revoked",
                status_code=status.HTTP_403_FORBIDDEN
            )

        return token_data


def _ensure_active(user: User):
    account_status = (getattr(user, "status", None) or "active").lower()
    if account_status not in ("active",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended. Contact Shipora support.",
        )


class ValidUser:
    async def __call__(
        self,
        token: dict = Depends(AccessTokenBearer()),
        session: AsyncSession = Depends(session),
    ):
        user_uid = token.get("user").get("uid")
        active_user = await auth_service.get_uid_user(uid=user_uid, session=session)
        if not active_user:
            raise HTTPException(
                detail="user not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # `account_verified` is set when the user clicks the email
        # verification link; `verified` is set for admin / Google accounts.
        if not (active_user.account_verified or active_user.verified):
            raise HTTPException(
                detail="account not verified",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        _ensure_active(active_user)

        return active_user

async def get_authenticated_user(
    token: dict = Depends(AccessTokenBearer()),
    session: AsyncSession = Depends(session),
):
    user_uid = token.get("user").get("uid")

    active_user = await auth_service.get_uid_user(
        uid=user_uid,
        session=session,
    )

    if not active_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return active_user


async def get_this_user(
    user_data: User = Depends(ValidUser()),
    session: AsyncSession = Depends(session),
):
    uid = user_data.uid
    user = await auth_service.get_current_user(uid=uid, session=session)
    if user is None:
        raise HTTPException(status_code=404, detail="User Not Found")
    return user


class RoleChecker:
    def __init__(self, roles: List[str]):
        self.roles = roles

    async def __call__(self, user: User = Depends(get_this_user)):
        role = getattr(user.role, "value", user.role)
        if role not in self.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User Not authorized to use this endpoint",
            )
        return True
