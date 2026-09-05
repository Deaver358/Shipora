from redis.asyncio import Redis as aioredis
import json
import uuid
from .config import settings

JTI_EXPIRY = 3600

redis_client = aioredis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db="1")

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