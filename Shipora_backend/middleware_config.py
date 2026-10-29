from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.utils.config import settings


def register_sessionMiddleware(app: FastAPI):
    # Only used to carry the OAuth "state" during Google sign-in.
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        same_site=settings.COOKIE_SAMESITE,
        https_only=settings.COOKIE_SECURE,
        max_age=60 * 60,
    )
