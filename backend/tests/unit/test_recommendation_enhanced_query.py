"""RecommendationService 쿼리 텍스트 생성 향상 테스트.

새 필드(target_jobs, target_industries, certificate_level, specific_keywords)가
쿼리 텍스트에 반영되어 벡터 검색 정확도를 높이는지 테스트.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


class TestBuildQueryTextWithEnhancedFields:
    """_build_query_text 메서드가 새 필드를 반영하는지 테스트."""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    def test_query_includes_target_jobs(self, service):
        """target_jobs가 쿼리 텍스트에 포함되어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자", "전기안전관리자"],
        )

        query_text = service._build_query_text(request)

        assert "전기기술자" in query_text
        assert "전기안전관리자" in query_text

    def test_query_includes_target_industries(self, service):
        """target_industries가 쿼리 텍스트에 포함되어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_industries=["전기공사", "건설업"],
        )

        query_text = service._build_query_text(request)

        assert "전기공사" in query_text
        assert "건설업" in query_text

    def test_query_includes_certificate_level(self, service):
        """certificate_level이 쿼리 텍스트에 포함되어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            certificate_level="기능장",
        )

        query_text = service._build_query_text(request)

        assert "기능장" in query_text

    def test_query_includes_specific_keywords(self, service):
        """specific_keywords가 쿼리 텍스트에 포함되어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            specific_keywords=["전기"],
        )

        query_text = service._build_query_text(request)

        assert "전기" in query_text

    def test_electrician_query_matches_certificate_format(self, service):
        """전기기능장 요청의 쿼리가 자격증 임베딩 형식과 유사해야 함.

        쿼리 텍스트가 자격증 데이터 형식과 유사하면 벡터 유사도가 높아짐.
        """
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자", "전기안전관리자"],
            target_industries=["전기공사", "제조업", "건설업"],
            certificate_level="기능장",
            specific_keywords=["전기"],
        )

        query_text = service._build_query_text(request)

        # 자격증 임베딩 형식과 유사한 키워드 포함 확인
        assert "관련직업" in query_text or "전기기술자" in query_text
        assert "산업분야" in query_text or "전기공사" in query_text
        assert "기능장" in query_text
        assert "전기" in query_text

    def test_query_without_new_fields_still_works(self, service):
        """새 필드 없이도 기존 쿼리 생성이 작동해야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )

        query_text = service._build_query_text(request)

        # 기본 정보는 포함되어야 함
        assert "취업" in query_text
        assert "IT개발" in query_text or "IT" in query_text


class TestQueryFormatMatchesCertificateEmbedding:
    """쿼리 텍스트가 자격증 임베딩 형식과 유사하게 생성되는지 테스트.

    자격증 임베딩 텍스트 형식:
    - 자격증: [제목]
    - 분류: [카테고리]
    - 산업분야: [산업]
    - 관련직업: [직업 리스트]
    - ...

    쿼리도 이와 유사한 형식이면 벡터 유사도가 높아짐.
    """

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    def test_query_has_structured_sections(self, service):
        """쿼리가 구조화된 섹션을 가져야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자"],
            target_industries=["전기공사"],
            certificate_level="기능장",
            specific_keywords=["전기"],
        )

        query_text = service._build_query_text(request)

        # 구조화된 형식 확인 (자격증 임베딩과 유사)
        # 최소한 키워드가 명확하게 포함되어야 함
        keywords_found = 0
        for keyword in ["전기", "기능장", "전기기술자", "전기공사"]:
            if keyword in query_text:
                keywords_found += 1

        assert keywords_found >= 3, f"Query should contain at least 3 keywords. Found: {keywords_found}"
