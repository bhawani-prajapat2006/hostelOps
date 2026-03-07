from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    app_name: str = "Hostel Issue Management System"

    # JWT — no default; forces .env to exist
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./hims.db"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Rate limiting
    LOGIN_RATE_LIMIT: str = "5/minute"

    # Brevo (email service) — leave empty to skip email sending (dev mode)
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = "noreply@hostelops.com"
    BREVO_SENDER_NAME: str = "HostelOps"

    # Frontend URL (for password reset links)
    FRONTEND_URL: str = "http://localhost:3000"

    # Upload settings
    MAX_UPLOAD_SIZE_MB: int = 5


settings = Settings()
