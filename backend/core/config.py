"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe config with .env file support.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Central configuration class.
    Values are loaded from .env file and can be overridden by real env vars.
    """

    # Application
    app_name: str = "GitInsight AI"
    app_version: str = "1.0.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///./gitinsight.db"

    # GitHub API (optional — enables higher rate limits)
    github_token: str = ""

    # Ollama (Phase 3)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:1.5b"

    # Cloud LLM API Keys (optional — enables cloud deployment)
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openai_api_key: str = ""

    # CORS — frontend dev server origin
    frontend_url: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    lru_cache ensures we only parse .env once per process lifecycle.
    """
    return Settings()
