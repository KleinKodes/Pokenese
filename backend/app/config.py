from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "postgresql+asyncpg://pokenese:pokenese@localhost:5432/pokenese"

    # JWT / Auth
    secret_key: str = "dev-secret-key-please-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Application
    environment: str = "development"
    seed_salt: str = "pokenese-daily-salt-change-in-production"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
