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

    # MariaDB Configuration (환경변수에서 로드)
    MARIADB_HOST: str  # 필수: .env에서 설정
    MARIADB_PORT: int # 필수 .env에서 설정
    MARIADB_USER: str  # 필수: .env에서 설정
    MARIADB_PASSWORD: str  # 필수: .env에서 설정
    MARIADB_DATABASE: str # 필수 .env에서 설정

    # Redis (Optional for MVP)
    REDIS_URL: str = "redis://localhost:6379"

    # Celery (Optional - for background tasks)
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # OpenAI API Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL_NAME: str # 필수 .env에서 설정
    OPENAI_EMBEDDING_MODEL: str # 필수 .env에서 설정
    OPENAI_EMBEDDING_DIMENSIONS: int # 필수 .env에서 설정

    # ChromaDB Configuration (환경변수에서 로드)
    CHROMA_HOST: str  # 필수: .env에서 설정
    CHROMA_PORT: int # 필수 .env에서 설정
    CHROMA_COLLECTION_NAME: str # 필수 .env에서 설정

    # BGE-M3 Configuration (Deprecated - kept for backward compatibility)
    # Now using OpenAI Embedding API instead
    BGE_M3_MODEL_NAME: str = "BAAI/bge-m3"
    BGE_M3_USE_FP16: bool = True
    BGE_M3_BATCH_SIZE: int = 32

    # Recommendation Service Configuration (B7: 하드코딩 제거)
    # 0.5로 상향: 관련 없는 자격증 추천 방지 (기존 0.35)
    RECOMMENDATION_MIN_SIMILARITY_SCORE: float = 0.5
    RECOMMENDATION_TOP_K: int = 10

    # Search Configuration (SearXNG)
    SEARCH_PROVIDER: str = "searxng"  # 검색 프로바이더 (searxng)
    SEARCH_RESULTS_PER_CATEGORY: int = 10  # 카테고리당 검색 결과 수 (10개로 증가)

    # Content Crawling Configuration (검색 결과 보강)
    # 검색 결과 URL에서 실제 페이지 콘텐츠를 추출
    CRAWL_ENABLED: bool = True  # 크롤링 활성화 여부
    CRAWL_TOP_N: int = 10  # 카테고리당 크롤링 시도할 최대 결과 수 (PDF 등 실패 대비)
    CRAWL_TARGET_SUCCESS: int = 3  # 크롤링 성공 목표 수 (이 수에 도달하면 중단)
    CRAWL_MAX_CONTENT_LENGTH: int = 2000  # 크롤링 콘텐츠 최대 길이 (자)
    CRAWL_TIMEOUT: float = 10.0  # 크롤링 타임아웃 (초)
    CRAWL_MAX_CONCURRENT: int = 5  # 동시 크롤링 최대 수

    # Embedding Provider Configuration
    # "openai": OpenAI API 사용 (서버용, 기본값)
    # "local": BGE-M3 로컬 모델 사용 (파이프라인용, FlagEmbedding 필요)
    EMBEDDING_PROVIDER: str # 필수 .env에서 설정

    # SearXNG Configuration (오픈소스 검색 엔진)
    # Docker: docker run -d -p 8888:8080 searxng/searxng
    SEARXNG_BASE_URL: str  # 필수: .env에서 설정
    SEARXNG_TIMEOUT: float = 30.0

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
