from pydantic_settings import SettingsConfigDict, BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    REDIS_HOST: str
    REDIS_PORT: int
    OpenRouteServiceKey: str
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_ENDPOINT_URL: str = ""
    BUCKET_NAME: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    PUBLIC_BASE_URL: str = "http://localhost:5173"
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_WEBHOOK_SECRET: str = ""
    KYC_PROVIDER_BASE_URL: str = ""
    KYC_PROVIDER_API_KEY: str = ""
    KYC_STRICT: bool = False
    UPLOAD_MAX_MB: int = 10

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")


settings = Settings()
