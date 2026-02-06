"""추천 이유 품질 테스트.

추천 이유 3번째 문장이 너무 일반적인 문제를 해결하기 위한 테스트.
- "꾸준히 학습하면 계획대로 취득할 수 있습니다."
- "자신의 페이스에 맞춰 유연하게 준비할 수 있습니다."

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from unittest.mock import MagicMock

from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


class TestRecommendationReasonQuality:
    """추천 이유 품질 테스트."""

    # 너무 일반적인 문구 (제거 또는 개선 대상)
    GENERIC_PHRASES = [
        "꾸준히 학습하면 계획대로 취득할 수 있습니다.",
        "자신의 페이스에 맞춰 유연하게 준비할 수 있습니다.",
    ]

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    @pytest.fixture
    def mock_cert(self):
        """Mock 자격증 객체."""
        cert = MagicMock()
        cert.id = "test_cert_001"
        cert.title = "정보처리기사"
        cert.study_period_days = 90
        cert.difficulty = "중급"
        cert.career_info = {"industry": ["IT", "소프트웨어"]}
        cert.exam_info = {"exam_type": "필기+실기"}
        return cert

    @pytest.fixture
    def moderate_request(self):
        """moderate 학습량 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            study_commitment="moderate",
        )

    @pytest.fixture
    def unsure_request(self):
        """unsure 학습량 요청."""
        return RecommendationRequest(
            purpose="개인 관심 / 교양",
            interest_domains=["IT개발"],
            study_timeline="1년 이상",
            difficulty_preference="쉬운 편",
            study_commitment="unsure",
        )

    def test_moderate_phrase_not_generic(self, service, mock_cert, moderate_request):
        """moderate 학습량 추천 이유가 일반적이지 않아야 함.

        TDD: '꾸준히 학습하면 계획대로 취득할 수 있습니다.'는
        어떤 자격증에도 적용 가능한 너무 일반적인 문구.
        """
        # 여러 번 호출해서 다양한 템플릿 확인
        phrases = set()
        for i in range(20):
            # 자격증 ID 변경해서 다른 템플릿 선택 유도
            mock_cert.id = f"test_cert_{i:03d}"
            phrase = service._build_commitment_based_phrase(mock_cert, moderate_request)
            if phrase:
                phrases.add(phrase)

        # 일반적인 문구가 포함되지 않아야 함
        for phrase in phrases:
            assert phrase not in self.GENERIC_PHRASES, (
                f"일반적인 문구 사용: {phrase}"
            )

    def test_unsure_phrase_not_generic(self, service, mock_cert, unsure_request):
        """unsure 학습량 추천 이유가 일반적이지 않아야 함.

        TDD: '자신의 페이스에 맞춰 유연하게 준비할 수 있습니다.'는
        의미 없는 문구.
        """
        phrases = set()
        for i in range(20):
            mock_cert.id = f"test_cert_{i:03d}"
            phrase = service._build_commitment_based_phrase(mock_cert, unsure_request)
            if phrase:
                phrases.add(phrase)

        # 일반적인 문구가 포함되지 않아야 함
        for phrase in phrases:
            assert phrase not in self.GENERIC_PHRASES, (
                f"일반적인 문구 사용: {phrase}"
            )

    def test_phrase_includes_specific_info(self, service, mock_cert, moderate_request):
        """추천 이유에 구체적인 정보가 포함되어야 함.

        최소한 학습 기간(개월) 또는 학습 방법이 언급되어야 함.
        """
        mock_cert.study_period_days = 90  # 3개월
        phrase = service._build_commitment_based_phrase(mock_cert, moderate_request)

        # 구체적 정보 포함 여부 확인 (개월, 시간, 기출문제, 실기 등)
        specific_keywords = ["개월", "시간", "기출", "실기", "필기", "취득", "합격"]
        has_specific_info = any(kw in phrase for kw in specific_keywords)

        assert has_specific_info, (
            f"구체적인 정보가 없는 문구: {phrase}"
        )


class TestRecommendationIntroWithDomain:
    """추천 이유 첫 문장에 사용자 선택 분야 반영 테스트."""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """RecommendationService 인스턴스."""
        return RecommendationService(db=mock_db)

    @pytest.fixture
    def it_cert(self):
        """IT 관련 자격증."""
        cert = MagicMock()
        cert.id = "info_processing"
        cert.title = "정보처리기사"
        cert.career_info = {"industry": ["IT", "소프트웨어"], "related_jobs": []}
        return cert

    @pytest.fixture
    def it_job_request(self):
        """IT개발 분야 취업 목적 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    @pytest.fixture
    def data_job_request(self):
        """데이터 분야 취업 목적 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    def test_intro_includes_selected_domain_for_employment(
        self, service, it_cert, it_job_request
    ):
        """취업 목적일 때 선택한 분야가 첫 문장에 포함되어야 함.

        TDD: 사용자가 IT개발 분야를 선택했는데 추천 이유에
        "IT개발"이 직접 언급되지 않는 문제를 해결.
        """
        intro = service._build_purpose_based_intro(it_cert, it_job_request)

        # 선택한 분야 "IT개발" 또는 "IT" 키워드가 포함되어야 함
        assert "IT" in intro or "개발" in intro, (
            f"선택한 분야가 언급되지 않음: {intro}"
        )

    def test_intro_includes_data_domain(self, service, it_cert, data_job_request):
        """데이터 분야 선택 시 첫 문장에 포함되어야 함."""
        intro = service._build_purpose_based_intro(it_cert, data_job_request)

        # 선택한 분야 "데이터" 키워드가 포함되어야 함
        assert "데이터" in intro, (
            f"선택한 분야가 언급되지 않음: {intro}"
        )

    def test_intro_still_mentions_purpose(self, service, it_cert, it_job_request):
        """분야를 포함하더라도 목적(취업)도 언급되어야 함."""
        intro = service._build_purpose_based_intro(it_cert, it_job_request)

        # 목적 "취업" 키워드가 포함되어야 함
        assert "취업" in intro, (
            f"목적이 언급되지 않음: {intro}"
        )
