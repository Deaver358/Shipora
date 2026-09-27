from itsdangerous import URLSafeTimedSerializer
from .config import settings
from fastapi.exceptions import HTTPException
import logging
from fastapi import status
import jwt
from datetime import datetime, timedelta, timezone
import uuid

serializer = URLSafeTimedSerializer(
    secret_key=settings.JWT_SECRET_KEY,
    salt="verification"
)

ACCESS_TOKEN_EXPIRY=3600



def create_url_safe_token(data: dict):
    token = serializer.dumps(data, salt="verification")
    return token


def decode_url_safe_token(token: str):
    try:
        token_data = serializer.loads(token, salt="verification")
        return token_data
    except Exception as e:
        logging.error(str(e))


def decode_token(token: str):
    try:
        token_data = jwt.decode(
            jwt=token,
            key=settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        return token_data

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )


def create_access_token(user_data: dict, expiry: timedelta = None, refresh: bool = False):
    payload = {}
    now = datetime.now(timezone.utc)

    if not expiry:
        expiry = timedelta(seconds=ACCESS_TOKEN_EXPIRY)

    final_expiry = now + expiry

    payload['user'] = user_data
    payload['exp'] = int(final_expiry.timestamp())
    payload['iat'] = int(now.timestamp())
    payload['jti'] = str(uuid.uuid4())
    payload['type'] = 'access'
    payload['refresh'] = refresh

    token = jwt.encode(
        payload=payload, key=settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return token, payload


def create_refresh_token(user_data: dict, expiry: timedelta = None, refresh: bool = True):
    payload = {}
    now = datetime.now(timezone.utc)

    if not expiry:
        expiry = ACCESS_TOKEN_EXPIRY

    final_expiry = timedelta(seconds=expiry) + now

    jti = uuid.UUID(user_data['uid'])

    payload['user'] = user_data
    payload['exp'] = int(final_expiry.timestamp())
    payload['iat'] = int(now.timestamp())
    payload['jti'] = str(uuid.uuid4())
    payload['type'] = 'refresh'
    payload['refresh'] = refresh

    token = jwt.encode(
        payload=payload, key=settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )

    return token, jti, payload