"""키워드 매칭 보너스 테스트.

새 필드(target_jobs, target_industries, certificate_level, specific_keywords)가
자격증 데이터와 매칭될 때 추가 점수 보너스를 부여하는 로직 테스트.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from unittest.mock import MagicMock

from app.schemas.certificate import Certificate, CategoryInfo
from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


@pytest.fixture
def mock_db():
    """Mock 데이터베이스 세션."""
    return MagicMock()


@pytest.fixture
def service(mock_db):
    """RecommendationService 인스턴스."""
    return RecommendationService(db=mock_db)


@pytest.fixture
def electrician_certificate():
    """전기기능장 자격증 객체."""
    from datetime import datetime
    return Certificate(
        id="cert_electrician",
        raw_id="raw_electrician",
        title="전기기능장",
        categories=[CategoryInfo(code="NT", name="국가기술자격")],
        series="기능장",
        difficulty=4,
        study_period_days=180,
        overview="전기기능장은 전기 분야의 최고 등급 국가기술자격증입니다.",
        career_info={
            "industry": ["전기공사", "제조업", "건설업"],
            "related_jobs": ["전기기술자", "전기안전관리자", "전기공사 관리자"],
            "use_cases": ["전기설비 시공", "전기설비 점검"],
        },
        job_market_info={
            "preferred_industries": ["전기공사", "제조업", "건설업"],
            "requirement_type": "우대",
        },
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@pytest.fixture
def it_certificate():
    """정보처리기사 자격증 객체."""
    from datetime import datetime
    return Certificate(
        id="cert_it",
        raw_id="raw_it",
        title="정보처리기사",
        categories=[CategoryInfo(code="NT", name="국가기술자격")],
        series="기사",
        difficulty=3,
        study_period_days=120,
        overview="정보처리기사는 IT 분야의 대표적인 국가기술자격증입니다.",
        career_info={
            "industry": ["IT", "소프트웨어", "정보통신"],
            "related_jobs": ["소프트웨어 개발자", "시스템 분석가", "데이터베이스 관리자"],
            "use_cases": ["소프트웨어 개발", "시스템 분석"],
        },
        job_market_info={
            "preferred_industries": ["IT", "금융", "공공기관"],
            "requirement_type": "필수",
        },
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


class TestKeywordMatchingBonus:
    """키워드 매칭 보너스 계산 테스트."""

    def test_specific_keywords_bonus_for_matching_title(self, service, electrician_certificate):
        """specific_keywords가 자격증 제목과 매칭되면 보너스를 부여해야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            specific_keywords=["전기"],
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 제목에 "전기" 포함 -> 보너스
        assert bonus >= 5, f"Expected bonus >= 5 for title match, got {bonus}"

    def test_specific_keywords_no_bonus_for_non_matching(self, service, it_certificate):
        """specific_keywords가 매칭되지 않으면 보너스가 없어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            specific_keywords=["전기"],
        )

        bonus = service._calculate_keyword_matching_bonus(it_certificate, request)

        # 정보처리기사에 "전기" 없음 -> 보너스 없음
        assert bonus == 0, f"Expected bonus = 0 for non-matching, got {bonus}"

    def test_target_jobs_bonus_for_matching(self, service, electrician_certificate):
        """target_jobs가 자격증 관련 직업과 매칭되면 보너스를 부여해야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자"],
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 관련 직업에 "전기기술자" 포함 -> 보너스
        assert bonus >= 5, f"Expected bonus >= 5 for job match, got {bonus}"

    def test_target_industries_bonus_for_matching(self, service, electrician_certificate):
        """target_industries가 자격증 산업 분야와 매칭되면 보너스를 부여해야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_industries=["전기공사"],
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 산업 분야에 "전기공사" 포함 -> 보너스
        assert bonus >= 3, f"Expected bonus >= 3 for industry match, got {bonus}"

    def test_certificate_level_bonus_for_matching(self, service, electrician_certificate):
        """certificate_level이 자격증 계열과 매칭되면 보너스를 부여해야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            certificate_level="기능장",
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 계열이 "기능장"과 일치 -> 보너스
        assert bonus >= 10, f"Expected bonus >= 10 for level match, got {bonus}"

    def test_certificate_level_no_bonus_for_different_level(self, service, it_certificate):
        """certificate_level이 다르면 보너스가 없어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            certificate_level="기능장",
        )

        bonus = service._calculate_keyword_matching_bonus(it_certificate, request)

        # 정보처리기사는 "기사" 계열 -> 기능장 보너스 없음
        assert bonus == 0, f"Expected bonus = 0 for different level, got {bonus}"

    def test_combined_bonus_for_multiple_matches(self, service, electrician_certificate):
        """여러 필드가 매칭되면 보너스가 누적되어야 함."""
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

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 모든 필드 매칭 -> 높은 보너스
        assert bonus >= 15, f"Expected bonus >= 15 for multiple matches, got {bonus}"

    def test_bonus_capped_at_maximum(self, service, electrician_certificate):
        """보너스는 최대값을 초과하지 않아야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자", "전기안전관리자"],
            target_industries=["전기공사", "제조업", "건설업"],
            certificate_level="기능장",
            specific_keywords=["전기", "기능장", "전기공사"],
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        # 보너스 최대값 제한 (예: 25점)
        assert bonus <= 25, f"Expected bonus <= 25 (capped), got {bonus}"


class TestKeywordBonusIntegration:
    """키워드 보너스가 최종 점수에 반영되는지 통합 테스트."""

    def test_electrician_gets_higher_score_with_matching_keywords(
        self, service, electrician_certificate, it_certificate
    ):
        """전기 키워드 요청 시 전기기능장이 정보처리기사보다 높은 보너스를 받아야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자"],
            certificate_level="기능장",
            specific_keywords=["전기"],
        )

        electrician_bonus = service._calculate_keyword_matching_bonus(
            electrician_certificate, request
        )
        it_bonus = service._calculate_keyword_matching_bonus(it_certificate, request)

        assert electrician_bonus > it_bonus, (
            f"Electrician bonus ({electrician_bonus}) should be higher than "
            f"IT bonus ({it_bonus}) for electric-related request"
        )


class TestNoNewFieldsBackwardCompatibility:
    """새 필드 없이도 기존 보너스 계산이 작동해야 함."""

    def test_no_new_fields_returns_zero_bonus(self, service, electrician_certificate):
        """새 필드가 없으면 키워드 보너스는 0이어야 함."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
        )

        bonus = service._calculate_keyword_matching_bonus(electrician_certificate, request)

        assert bonus == 0, f"Expected bonus = 0 when no new fields, got {bonus}"
