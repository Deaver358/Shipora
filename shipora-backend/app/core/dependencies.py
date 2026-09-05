from fastapi import Request, status, Depends
from fastapi.security import HTTPBearer
from fastapi.exceptions import HTTPException
from typing import Dict, Any, List
from ..utils.validators import decode_token
from ..utils.redis import get_access_token, token_in_blocklist, get_refresh_token
import asyncio
from app.models.user_model import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.session_config import session
from app.services.auth_services import AuthService
import json


auth_service = AuthService()

class AccessTokenBearer(HTTPBearer):
    async def __call__(self, request: Request) -> Dict[str, Any]:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                detail="missing access token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        
        tib = await token_in_blocklist(token)
        if tib:
            raise HTTPException(
                detail="token is blocked",
                status_code=status.HTTP_403_FORBIDDEN
            )

        token_data = await asyncio.to_thread(decode_token, token)
        if token_data is None:
            raise HTTPException(
                detail="invalid access token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if token_data['refresh']:
            raise HTTPException(
                detail="access token required",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        uid = token_data.get("user").get("uid")
        stored_token = json.loads((await get_access_token(user_uid=uid)).decode("utf-8"))

        if stored_token is None:
            raise HTTPException(
                detail="access token expired",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        if stored_token != token_data:
            raise HTTPException(
                detail=f"access token revoked {stored_token, token_data}",
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
                detail=f"missing refresh token {token}",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        
        token_data = await asyncio.to_thread(decode_token, token)
        if token_data is None:
            raise HTTPException(
                detail="invalid refresh token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not token_data['refresh']:
            raise HTTPException(
                detail="refresh token required",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        uid = token_data.get("user").get("uid")
        stored_token = json.loads((await get_refresh_token(user_uid=uid)).decode("utf-8"))

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
                status=status.HTTP_404_NOT_FOUND
            )

        if not active_user.verified:
            raise HTTPException(
                detail="account not verified",
                status=status.HTTP_401_UNAUTHORIZED
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
        if user.role not in self.roles:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User Not authorized to use this endpoint",
            )
        return True



