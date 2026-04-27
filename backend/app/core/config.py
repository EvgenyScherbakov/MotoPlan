from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://motoplan:motoplan@localhost:5432/motoplan"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024

    class Config:
        env_file = ".env"


settings = Settings()