from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.utils.config import settings


def register_sessionMiddleware(app: FastAPI):
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.GOOGLE_CLIENT_SECRET,
        same_site="none",
        https_only=True,
    )
