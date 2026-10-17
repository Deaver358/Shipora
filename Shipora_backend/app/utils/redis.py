from redis.asyncio import Redis as aioredis
from redis.backoff import ExponentialBackoff
from redis.asyncio.retry import Retry
from redis.exceptions import ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError
import json
import uuid
from .config import settings

JTI_EXPIRY = 3600

# Errors that mean "Redis is unreachable" (as opposed to a bad command)
REDIS_UNAVAILABLE_ERRORS = (RedisConnectionError, RedisTimeoutError, OSError)

_redis_options = dict(
    socket_connect_timeout=5,
    socket_timeout=5,
    health_check_interval=30,
    retry=Retry(ExponentialBackoff(cap=2, base=0.1), 3),
)

if settings.REDIS_URL:
    # Managed Redis (Upstash, Render Key Value, Redis Cloud…) usually needs a
    # password and/or TLS (rediss://), which only the URL form carries.
    redis_client = aioredis.from_url(settings.REDIS_URL, **_redis_options)
else:
    redis_client = aioredis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        **_redis_options,
    )


async def ping() -> bool:
    try:
        return bool(await redis_client.ping())
    except Exception:
        return False


async def add_jti_to_blocklist(jti: str) -> None:
    """Adds tokens to blocklist"""
    await redis_client.set(name=jti, value="", ex=JTI_EXPIRY)


async def token_in_blocklist(jti: str) -> bool:
    """Checks for token in blocklist"""
    jti = await redis_client.get(jti)

    return jti is not None


async def store_refresh_token(user_uid: uuid.UUID, value):
    key = f"refresh:user:{str(user_uid)}"
    value = json.dumps(value)
    await redis_client.set(key, value, ex=7 * 24 * 60 * 60)

async def store_access_token(user_uid: uuid.UUID, value):
    key = f"access:user:{str(user_uid)}"
    value = json.dumps(value)
    await redis_client.set(key, value, ex=7 * 24 * 60 * 60)

async def get_refresh_token(user_uid: uuid.UUID):
    return await redis_client.get(f"refresh:user:{str(user_uid)}")

async def get_access_token(user_uid: uuid.UUID):
    return await redis_client.get(f"access:user:{str(user_uid)}")

async def del_refresh_token(user_uid: uuid.UUID):
    return await redis_client.delete(
        f"refresh:user:{str(user_uid)}"
    )

async def del_access_token(user_uid: uuid.UUID):
    return await redis_client.delete(
        f"access:user:{str(user_uid)}"
    )
