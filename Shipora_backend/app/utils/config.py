from pydantic import field_validator
from pydantic_settings import SettingsConfigDict, BaseSettings
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:5174,"
    "http://127.0.0.1:5174,"
    "https://shipora-one.vercel.app"
)


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    # Optional explicit OAuth callback, e.g.
    # https://api.example.com/api/v1.0/auth/google (must match Google Console)
    GOOGLE_REDIRECT_URI: str = ""
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    # Either REDIS_URL (e.g. rediss://:password@host:6379/0 from a managed
    # Redis provider) or REDIS_HOST/REDIS_PORT can be used.
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = ""
    REDIS_DB: int = 1
    # When Redis is unreachable, keep authenticating users from the signed
    # JWT alone instead of locking everyone out. Revocation is enforced again
    # as soon as Redis is back.
    REDIS_FAIL_OPEN: bool = True
    OpenRouteServiceKey: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_ENDPOINT_URL: str = ""
    BUCKET_NAME: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    # Public URL of the frontend (used for email links and payment redirects)
    PUBLIC_BASE_URL: str = "http://localhost:5173"
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_WEBHOOK_SECRET: str = ""
    KYC_PROVIDER_BASE_URL: str = "https://api.qoreid.com"
    # QoreID credentials must come from the environment (never commit them).
    KYC_CLIENT_ID: str = ""
    KYC_CLIENT_SECRET: str = ""
    KYC_PROVIDER_API_KEY: str = ""
    KYC_STRICT: bool = False
    UPLOAD_MAX_MB: int = 10

    # ---- production / deployment ------------------------------------
    ENVIRONMENT: str = "production"
    # Comma separated list of allowed browser origins (frontend URLs)
    CORS_ORIGINS: str = DEFAULT_CORS_ORIGINS
    # Optional regex for preview deployments, e.g. https://shipora-.*\.vercel\.app
    CORS_ORIGIN_REGEX: str = ""
    # Secret used to sign the OAuth session cookie. Falls back to
    # GOOGLE_CLIENT_SECRET so existing deployments keep working.
    SESSION_SECRET_KEY: str = ""
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "none"
    COOKIE_DOMAIN: str = ""
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    MAIL_VALIDATE_CERTS: bool = True
    MAIL_SUPPRESS_SEND: bool = False
    EMAIL_VERIFICATION_MAX_AGE_HOURS: int = 72
    PASSWORD_RESET_MAX_AGE_MINUTES: int = 60
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalise_database_url(cls, value: str) -> str:
        """
        Hosting providers (Render, Railway, Heroku, Neon, Supabase) hand out
        URLs like ``postgres://...?sslmode=require``. The async engine needs
        ``postgresql+asyncpg://`` and asyncpg uses ``ssl`` instead of
        ``sslmode``.
        """
        value = (value or "").strip()

        if value.startswith("postgres://"):
            value = "postgresql+asyncpg://" + value[len("postgres://"):]
        elif value.startswith("postgresql://"):
            value = "postgresql+asyncpg://" + value[len("postgresql://"):]

        if value.startswith("postgresql+asyncpg://"):
            parts = urlsplit(value)
            query = parse_qsl(parts.query, keep_blank_values=True)
            fixed = []
            for key, val in query:
                if key == "sslmode":
                    if val in ("require", "verify-ca", "verify-full", "prefer"):
                        fixed.append(("ssl", val))
                    continue
                if key in ("channel_binding",):
                    continue
                fixed.append((key, val))
            value = urlunsplit(parts._replace(query=urlencode(fixed)))

        return value

    @property
    def cors_origins(self) -> list[str]:
        origins = {
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        }
        if self.PUBLIC_BASE_URL:
            origins.add(self.PUBLIC_BASE_URL.strip().rstrip("/"))
        return sorted(origins)

    @property
    def frontend_url(self) -> str:
        return (self.PUBLIC_BASE_URL or "http://localhost:5173").rstrip("/")

    @property
    def session_secret(self) -> str:
        return self.SESSION_SECRET_KEY or self.GOOGLE_CLIENT_SECRET or self.JWT_SECRET_KEY


settings = Settings()
