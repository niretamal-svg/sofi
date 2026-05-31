"""
FastAPI application configuration using Pydantic Settings.
Loads environment variables and provides centralized config object.
"""

import json
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    # Firebase Configuration
    firebase_project_id: str
    firebase_service_account_key: str  # JSON string

    # MongoDB Configuration
    mongodb_uri: str = "mongodb://mongodb:27017"
    mongodb_db_name: str = "sofi_db"

    # Google Gemini
    gemini_api_key: str

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str

    # Encryption
    encryption_key: str  # Fernet key (base64 encoded)

    # Application
    environment: str = "dev"  # dev|prod
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    # Server
    api_prefix: str = "/api/v1"
    debug: bool = False
    enable_mocks: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    def get_firebase_credentials(self) -> dict:
        """Parse Firebase service account JSON string."""
        try:
            creds = json.loads(self.firebase_service_account_key)
            if "private_key" in creds:
                # Fix double escaped newlines and empty lines in private key
                raw_key = creds["private_key"].replace("\\n", "\n").replace("\\\\n", "\n")
                clean_lines = [line.strip() for line in raw_key.split("\n") if line.strip()]
                creds["private_key"] = "\n".join(clean_lines)
            return creds
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid Firebase service account JSON: {e}")

    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "prod"


# Global settings instance
settings = Settings()
