"""Application configuration using Pydantic Settings.

This module provides centralized configuration management
using environment variables with type validation.
"""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        SUPABASE_URL: Supabase project URL.
        SUPABASE_ANON_KEY: Supabase anonymous key for client-side access.
        SUPABASE_SERVICE_ROLE_KEY: Supabase service role key for server-side access.
        SUPABASE_DB_URL: PostgreSQL connection URL.
        REDIS_URL: Redis connection URL.
        BRAVE_API_KEY: Brave Search API key.
        OPENAI_API_KEY: OpenAI API key.
        CHROMA_HOST: ChromaDB server host.
        CHROMA_PORT: ChromaDB server port.
        CHROMA_COLLECTION_NAME: ChromaDB collection name.
        BGE_M3_MODEL_NAME: BGE-M3 model name for embeddings.
        BGE_M3_USE_FP16: Whether to use FP16 for BGE-M3.
        BGE_M3_BATCH_SIZE: Batch size for BGE-M3 embedding generation.
        ENVIRONMENT: Application environment (development, staging, production).
        DEBUG: Debug mode flag.
        LOG_LEVEL: Logging level.
        CORS_ORIGINS: CORS allowed origins.
        CELERY_BROKER_URL: Celery broker URL.
        CELERY_RESULT_BACKEND: Celery result backend URL.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),  # .env.local이 있으면 덮어씌움
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields in .env
    )

    # Supabase Configuration (Required)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_DB_URL: Optional[str] = None

    # MariaDB Configuration
    MARIADB_HOST: str = "localhost"
    MARIADB_PORT: int = 3306
    MARIADB_USER: str = "root"
    MARIADB_PASSWORD: str = ""
    MARIADB_DATABASE: str = "certificate_master"

    # Redis (Optional for MVP)
    REDIS_URL: str = "redis://localhost:6379"

    # Celery (Optional - for background tasks)
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # External APIs (Optional - can be added later)
    BRAVE_API_KEY: Optional[str] = None

    # OpenAI API Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL_NAME: str = "gpt-4o-mini"  # 빠르고 저렴한 모델

    # ChromaDB Configuration (외부 서버)
    CHROMA_HOST: str = "db01.server.ivetech.co.kr"
    CHROMA_PORT: int = 38000
    CHROMA_COLLECTION_NAME: str = "certificate-master-index"

    # BGE-M3 Configuration
    BGE_M3_MODEL_NAME: str = "BAAI/bge-m3"
    BGE_M3_USE_FP16: bool = True
    BGE_M3_BATCH_SIZE: int = 32

    # Recommendation Service Configuration (B7: 하드코딩 제거)
    RECOMMENDATION_MIN_SIMILARITY_SCORE: float = 0.35
    RECOMMENDATION_TOP_K: int = 5

    # Brave Search Configuration (Enrich용)
    BRAVE_SEARCH_RESULTS_PER_CATEGORY: int = 5  # 카테고리당 검색 결과 수 (기본 10 → 5)

    # Application Settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str  # .env에서 필수로 불러옴


@lru_cache()
def get_settings() -> Settings:
    """Get cached Settings instance.

    Returns:
        Cached Settings instance loaded from environment.
    """
    return Settings()
