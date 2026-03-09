from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "CrediSight AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./credisight.db"
    DATABASE_URL_SYNC: str = "sqlite:///./credisight.db"

    # JWT
    SECRET_KEY: str = "change-this-to-a-strong-random-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # External APIs (optional)
    NEWS_API_KEY: Optional[str] = None
    MCA_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
