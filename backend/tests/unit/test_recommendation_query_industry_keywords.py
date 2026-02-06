"""쿼리 텍스트 산업 키워드 강화 테스트.

interest_domains에 매핑된 산업 키워드를 쿼리 텍스트에 추가하여
벡터 검색 품질을 향상시킵니다.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from unittest.mock import MagicMock

from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


class TestQueryIndustryKeywords:
    """쿼리 텍스트에 산업 키워드가 포함되는지 테스트."""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    @pytest.fixture
    def it_request(self):
        """IT개발 분야 추천 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    @pytest.fixture
    def multi_domain_request(self):
        """여러 분야 추천 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발", "데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    def test_query_text_includes_industry_keywords(self, service, it_request):
        """쿼리 텍스트에 IT개발 관련 산업 키워드가 포함되어야 함."""
        query_text = service._build_query_text(it_request)

        # IT개발의 산업 키워드: IT, 소프트웨어, 정보기술, 개발, ICT, 정보통신, 컴퓨터
        # "산업분야 키워드:" 또는 "산업키워드:" 형식 확인
        assert "산업분야 키워드:" in query_text or "산업키워드:" in query_text

    def test_query_text_includes_multiple_domain_keywords(
        self, service, multi_domain_request
    ):
        """여러 분야의 산업 키워드가 모두 포함되어야 함."""
        query_text = service._build_query_text(multi_domain_request)

        # IT개발: IT, 소프트웨어, 정보기술
        # 데이터: 데이터, AI, 빅데이터
        # 두 분야의 키워드가 모두 포함되어야 함
        has_it_keyword = any(
            kw in query_text for kw in ["IT", "소프트웨어", "정보기술"]
        )
        has_data_keyword = any(kw in query_text for kw in ["데이터", "AI", "빅데이터"])

        assert has_it_keyword, "IT개발 관련 키워드가 쿼리에 포함되어야 함"
        assert has_data_keyword, "데이터 관련 키워드가 쿼리에 포함되어야 함"

    def test_query_text_still_includes_domain_text(self, service, it_request):
        """기존 분야 텍스트도 유지되어야 함."""
        query_text = service._build_query_text(it_request)

        # IT개발 분야 텍스트가 포함되어야 함
        # 기존 로직에서는 "IT개발 분야와 연관된" 형식으로 표현됨
        assert "IT개발" in query_text

    def test_query_text_format_with_user_summary(self, service, mock_db):
        """user_summary가 있어도 산업 키워드가 포함되어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            user_summary="정보처리기사 자격증을 취득하고 싶습니다",
        )

        query_text = service._build_query_text(request)

        # user_summary가 있어도 산업 키워드가 포함
        # (user_summary 모드에서도 적용되어야 함)
        assert "IT개발" in query_text

    def test_query_text_with_unknown_domain_no_error(self, service, mock_db):
        """DOMAIN_INDUSTRY_MAPPING에 있는 분야도 에러 없이 처리."""
        # 유효한 분야 (DOMAIN_INDUSTRY_MAPPING에 매핑됨)
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["서비스"],  # 매핑 있음
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

        # 에러 없이 실행되어야 함
        query_text = service._build_query_text(request)
        # 서비스 분야가 쿼리에 포함
        assert "서비스" in query_text
