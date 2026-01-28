"""임베딩 서비스 팩토리.

이 모듈은 설정에 따라 적절한 임베딩 서비스를 생성합니다.

지원하는 provider:
- "openai": OpenAI API 기반 임베딩 (서버용, 기본값)
- "local": BGE-M3 로컬 모델 (파이프라인용)

사용 예:
    # 환경변수 기반 자동 선택
    service = get_embedding_service()

    # 명시적 provider 지정
    service = get_embedding_service("local")
"""
import logging
from typing import Literal, Optional

from app.core.config import get_settings
from app.services.embedding.protocol import EmbeddingServiceProtocol

logger = logging.getLogger(__name__)

EmbeddingProvider = Literal["openai", "local"]


def get_embedding_service(
    provider: Optional[EmbeddingProvider] = None,
) -> EmbeddingServiceProtocol:
    """임베딩 서비스를 생성합니다.

    Args:
        provider: 사용할 provider ("openai" 또는 "local").
                  None이면 환경변수 EMBEDDING_PROVIDER 또는 기본값 "openai" 사용.

    Returns:
        EmbeddingServiceProtocol 구현체.

    Raises:
        ValueError: 지원하지 않는 provider인 경우.
        ImportError: local provider 사용 시 FlagEmbedding이 설치되지 않은 경우.
    """
    if provider is None:
        settings = get_settings()
        provider = getattr(settings, "EMBEDDING_PROVIDER", "openai")

    logger.info(f"임베딩 서비스 생성: provider={provider}")

    if provider == "openai":
        from app.services.embedding.service import EmbeddingService
        return EmbeddingService()

    elif provider == "local":
        # 로컬 임베딩 서비스는 scripts에서만 import
        # 서버에서 실수로 호출하면 ImportError 발생
        try:
            from scripts.services.local_embedding import LocalEmbeddingService
            return LocalEmbeddingService()
        except ImportError as e:
            raise ImportError(
                "로컬 임베딩 서비스를 사용하려면 FlagEmbedding이 필요합니다. "
                "'uv sync --extra local'로 설치하세요."
            ) from e

    else:
        raise ValueError(
            f"지원하지 않는 embedding provider: {provider}. "
            "지원: 'openai', 'local'"
        )
