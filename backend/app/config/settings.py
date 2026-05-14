from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/leatherpro_erp"
    SECRET_KEY: str = "leatherflow-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    APP_NAME: str = "Leather Pro AI ERP"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760
    AI_MODELS_DIR: str = "ai_models"
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "ghoshdebrupa005@gmail.com"
    SMTP_PASSWORD: str = "bmuqvjslzrexwths"
    SMTP_FROM_EMAIL: str = "ghoshdebrupa005@gmail.com"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
