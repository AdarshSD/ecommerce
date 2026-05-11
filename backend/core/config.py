from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    STORAGE_BACKEND: str = "local"
    MEDIA_ROOT: str = "./media"
    MEDIA_BASE_URL: str = "http://localhost:8000/media"

    FIRST_ADMIN_EMAIL: str = ""
    FIRST_ADMIN_PASSWORD: str = ""
    FIRST_ADMIN_FIRST_NAME: str = "Admin"
    FIRST_ADMIN_LAST_NAME: str = "User"

    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"


settings = Settings()
