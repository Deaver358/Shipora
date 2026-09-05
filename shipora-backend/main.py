from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.session_config import engine
from sqlmodel import SQLModel
from contextlib import asynccontextmanager
from .middleware_config import register_sessionMiddleware
from app.utils.path import static_files_path
from app.routes.auth_routers import router as auth_router

version = "v1.0"
schedular = AsyncIOScheduler()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        print("Database connection okay")

    except Exception as e:
        print(f"Database connection failed: {e}")

@asynccontextmanager
async def life_span(app: FastAPI):
    print("Willstore social starting")
    await init_db()

    schedular.start()
    print("schedular started")
    yield

    schedular.shutdown()
    print("Schedular stopped: server stopped")


app = FastAPI(
    title="WILLSTORE", version=version, description="""William Social Marketplace** is a platform where users can browse and purchase verified social media accounts. Starting with TikTok accounts, the marketplace allows customers to explore accounts based on details such as niche, audience size, and pricing, while providing a smooth purchasing experience through a secure online system.""", lifespan=life_span
)

API_PREFIX = f"/api/{version}"


register_sessionMiddleware(app)

app.mount("/static", StaticFiles(directory=static_files_path), name="static")

app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
