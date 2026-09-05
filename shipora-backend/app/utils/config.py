from pydantic_settings import SettingsConfigDict, BaseSettings
from pathlib import Path
import secrets

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
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_ENDPOINT_URL: str
    BUCKET_NAME: str
    PUBLIC_BASE_URL: str
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

settings = Settings()