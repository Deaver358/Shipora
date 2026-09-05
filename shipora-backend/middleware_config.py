from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from .app.utils.config import settings


def register_sessionMiddleware(app: FastAPI):
    app.middleware("http")
    app.add_middleware(
        SessionMiddleware, 
        secret_key=settings.GOOGLE_CLIENT_SECRET
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173/"
        ],  # Second one acts as a fallback
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
