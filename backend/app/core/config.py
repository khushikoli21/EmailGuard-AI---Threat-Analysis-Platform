import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "EmailGuard AI - Threat Analysis Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Database: SQLite default fallback for zero-setup local dev; PostgreSQL supported for production
    DATABASE_URL: str = "sqlite:///./emailguard.db"

    # Security & Encryption Key (Fernet encryption for tokens)
    SECRET_KEY: str = "insecure_dev_key_only_change_in_production_32bytes"

    # AI / LLM Configuration
    LLM_PROVIDER: str = "gemini"  # 'gemini', 'openai', 'groq', or 'rule_based'
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"

    # Threat Intelligence Integrations
    VIRUSTOTAL_API_KEY: str = ""
    URLSCAN_API_KEY: str = ""

    # Vector Knowledge Store (ChromaDB)
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"

    # Google Workspace OAuth 2.0 (Gmail API)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/gmail/callback"

    # Deterministic Risk Engine Weights (Configurable 0-100 scale)
    WEIGHT_MALICIOUS_URL: float = 45.0
    WEIGHT_SUSPICIOUS_URL: float = 25.0
    WEIGHT_CREDENTIAL_REQUEST: float = 30.0
    WEIGHT_URGENCY_LANGUAGE: float = 20.0
    WEIGHT_SENDER_MISMATCH: float = 25.0
    WEIGHT_IMPERSONATION: float = 35.0
    WEIGHT_PAYMENT_REQUEST: float = 30.0
    WEIGHT_MALICIOUS_ATTACHMENT: float = 40.0
    WEIGHT_PROMPT_INJECTION: float = 50.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
