"""낮은 유사도 결과 필터링 테스트.

관련 없는 자격증이 추천되는 것을 방지하기 위해,
유사도가 특정 임계값 미만이면 결과에서 제외해야 함.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.

2026-02-06: ABSOLUTE_MIN_SCORE 0.45 → 0.55로 상향 조정
- IT개발 분야 선택 시 미용사, 항공사진기능사 등 무관한 자격증 추천 방지
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


class TestLowSimilarityFiltering:
    """낮은 유사도 결과 필터링 테스트."""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    def test_very_low_similarity_results_excluded(self, service):
        """매우 낮은 유사도(MIN_SIMILARITY_SCORE 미만 & ABSOLUTE_MIN_SCORE 미만) 결과는 제외되어야 함.

        MIN_SIMILARITY_SCORE=0.5 미만이고, ABSOLUTE_MIN_SCORE=0.55 미만이면 빈 결과.
        """
        # 모든 결과가 MIN_SIMILARITY_SCORE(0.5) 미만이고 ABSOLUTE_MIN_SCORE(0.55) 미만
        results = [
            {"id": "cert1", "score": 0.49, "metadata": {"title": "무관한자격증1"}},
            {"id": "cert2", "score": 0.40, "metadata": {"title": "무관한자격증2"}},
            {"id": "cert3", "score": 0.30, "metadata": {"title": "무관한자격증3"}},
        ]

        filtered = service._filter_by_similarity(results)

        # MIN_SIMILARITY_SCORE 미만이고 top_result도 ABSOLUTE_MIN_SCORE 미만이면 빈 리스트
        assert filtered == [], f"Very low similarity results should be excluded, got {filtered}"

    def test_moderate_similarity_included(self, service):
        """적당한 유사도(0.5 이상) 결과는 포함되어야 함."""
        results = [
            {"id": "cert1", "score": 0.60, "metadata": {"title": "관련자격증1"}},
            {"id": "cert2", "score": 0.48, "metadata": {"title": "약간관련자격증"}},
            {"id": "cert3", "score": 0.30, "metadata": {"title": "무관한자격증"}},
        ]

        filtered = service._filter_by_similarity(results)

        # 0.5(MIN_SIMILARITY_SCORE) 이상만 포함
        assert len(filtered) == 1
        assert filtered[0]["id"] == "cert1"

    def test_fallback_only_when_above_minimum_threshold(self, service):
        """폴백은 최소 임계값(0.55) 이상인 경우에만 적용되어야 함.

        MIN_SIMILARITY_SCORE(0.5) 이상이면 먼저 필터링됨.
        여기서는 0.5 미만이지만 ABSOLUTE_MIN_SCORE(0.55) 이상인 경우 폴백 동작 테스트.

        수정: MIN_SIMILARITY_SCORE=0.5 미만, 하지만 top_result >= ABSOLUTE_MIN_SCORE
        -> 불가능. MIN_SIMILARITY_SCORE(0.5) < ABSOLUTE_MIN_SCORE(0.55)이므로
        0.5 미만인 결과가 0.55 이상일 수 없음.

        실제 시나리오: MIN_SIMILARITY_SCORE 이상인 결과가 있으면 폴백이 필요 없음.
        따라서 이 테스트는 MIN_SIMILARITY_SCORE 이상인 결과가 모두 반환되는지 확인.
        """
        # MIN_SIMILARITY_SCORE(0.5) 이상인 결과 2개
        results = [
            {"id": "cert1", "score": 0.58, "metadata": {"title": "관련자격증1"}},
            {"id": "cert2", "score": 0.56, "metadata": {"title": "관련자격증2"}},
        ]

        filtered = service._filter_by_similarity(results)

        # MIN_SIMILARITY_SCORE(0.5) 이상인 결과는 모두 반환
        assert len(filtered) == 2
        assert filtered[0]["id"] == "cert1"
        assert filtered[1]["id"] == "cert2"

    def test_no_fallback_when_all_below_absolute_minimum(self, service):
        """모든 결과가 MIN_SIMILARITY_SCORE 미만이고 ABSOLUTE_MIN_SCORE 미만이면 폴백 없음.

        MIN_SIMILARITY_SCORE=0.5, ABSOLUTE_MIN_SCORE=0.55
        모든 결과가 0.5 미만이면 폴백 로직 진입.
        top_result도 0.55 미만이면 빈 리스트 반환.
        """
        results = [
            {"id": "cert1", "score": 0.49, "metadata": {"title": "무관한자격증1"}},
            {"id": "cert2", "score": 0.45, "metadata": {"title": "무관한자격증2"}},
        ]

        filtered = service._filter_by_similarity(results)

        # MIN_SIMILARITY_SCORE 미만이고 top_result도 ABSOLUTE_MIN_SCORE 미만이므로 빈 리스트
        assert filtered == []

    def test_score_between_old_and_new_threshold_excluded(self, service):
        """이전 임계값(0.45)과 새 임계값(0.55) 사이 점수는 폴백에서도 제외되어야 함.

        2026-02-06: IT개발 분야 선택 시 미용사 등 무관한 자격증이
        0.45~0.55 사이 유사도로 추천되던 문제 해결.

        MIN_SIMILARITY_SCORE(0.5) 미만인 결과가 폴백될 때,
        ABSOLUTE_MIN_SCORE(0.55) 미만이면 제외됨.
        """
        results = [
            {"id": "cert1", "score": 0.49, "metadata": {"title": "미용사(피부)"}},
            {"id": "cert2", "score": 0.48, "metadata": {"title": "항공사진기능사"}},
            {"id": "cert3", "score": 0.46, "metadata": {"title": "무관한자격증"}},
        ]

        filtered = service._filter_by_similarity(results)

        # MIN_SIMILARITY_SCORE(0.5) 미만이고 top_result도 ABSOLUTE_MIN_SCORE(0.55) 미만이므로 빈 리스트
        assert filtered == [], "Scores between 0.45-0.55 should be excluded with new threshold"


class TestEmptyResultsMessage:
    """관련 자격증이 없을 때 적절한 응답 테스트."""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    @pytest.mark.asyncio
    async def test_empty_recommendations_when_no_relevant_certificates(self, service):
        """관련 자격증이 없으면 빈 추천 목록 반환."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["마케팅/홍보/조사"],
            study_timeline="6개월 이하",
            difficulty_preference="쉬운 편",
        )

        # Mock vector store to return very low similarity results
        with patch.object(service, "vector_store") as mock_vs:
            mock_vs.search_records.return_value = [
                {"id": "cert1", "score": 0.15, "metadata": {"title": "무관한자격증"}},
            ]

            response = await service.get_recommendations(request)

            # 빈 추천 목록
            assert response.recommendations == []
            assert response.total_matched == 0
