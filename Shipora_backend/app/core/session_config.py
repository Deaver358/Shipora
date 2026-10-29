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
    # SQL echo logs every statement (and its parameters) — keep it off in
    # production; enable with DB_ECHO=true when debugging locally.
    echo=settings.DB_ECHO,
    # Drop dead connections (DB restarts, idle timeouts on managed Postgres)
    # before handing them to a request.
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=True,
    # With AsyncSession, expired attributes cannot be lazily reloaded, so
    # touching an object after commit() raised MissingGreenlet (HTTP 500)
    # in many endpoints. Objects keep their loaded state after commit and
    # are refreshed explicitly where fresh data is needed.
    expire_on_commit=False,
    class_=AsyncSession
)

class Base(DeclarativeBase):
    pass

async def session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
