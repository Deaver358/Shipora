from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
    AsyncSession
)

from typing import AsyncGenerator
from sqlalchemy.orm import DeclarativeBase

from app.utils.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=True,
    expire_on_commit=True,
    class_=AsyncSession
)

class Base(DeclarativeBase):
    pass

async def session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session