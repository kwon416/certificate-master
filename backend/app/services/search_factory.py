"""검색 서비스 팩토리.

이 모듈은 설정에 따라 적절한 검색 서비스를 생성합니다.

지원하는 provider:
- "brave": Brave Search API (기본값, 유료)
- "searxng": SearXNG 메타 검색 엔진 (오픈소스, 무료)

사용 예:
    # 환경변수 기반 자동 선택
    service = get_search_service()

    # 명시적 provider 지정
    service = get_search_service("searxng")
"""
import logging
from typing import Literal, Optional, Union

from app.core.config import get_settings
from app.services.search_protocol import SearchServiceProtocol

logger = logging.getLogger(__name__)

SearchProvider = Literal["brave", "searxng"]


def get_search_service(
    provider: Optional[SearchProvider] = None,
) -> SearchServiceProtocol:
    """검색 서비스를 생성합니다.

    Args:
        provider: 사용할 provider ("brave" 또는 "searxng").
                  None이면 환경변수 SEARCH_PROVIDER 또는 기본값 "brave" 사용.

    Returns:
        SearchServiceProtocol 구현체.

    Raises:
        ValueError: 지원하지 않는 provider인 경우.
    """
    if provider is None:
        settings = get_settings()
        provider = getattr(settings, "SEARCH_PROVIDER", "brave")

    logger.info(f"검색 서비스 생성: provider={provider}")

    if provider == "brave":
        from app.services.brave_search import BraveSearchService

        return BraveSearchService()

    elif provider == "searxng":
        from app.services.searxng_search import SearXNGSearchService

        return SearXNGSearchService()

    else:
        raise ValueError(
            f"지원하지 않는 search provider: {provider}. " "지원: 'brave', 'searxng'"
        )


# Convenience functions for backward compatibility
def get_brave_service():
    """Brave Search 서비스를 반환합니다 (하위 호환성).

    Returns:
        BraveSearchService 인스턴스.
    """
    from app.services.brave_search import get_brave_service as _get_brave

    return _get_brave()


def get_searxng_service():
    """SearXNG Search 서비스를 반환합니다.

    Returns:
        SearXNGSearchService 인스턴스.
    """
    from app.services.searxng_search import get_searxng_service as _get_searxng

    return _get_searxng()
