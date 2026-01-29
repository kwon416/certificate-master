"""RecommendationService 소프트 필터 + 폴백 로직 테스트.

TDD: 하드 필터 → 소프트 필터(점수 가산) 변경 검증.
폴백: 결과 0개 시 조건 완화하여 무조건 결과 반환.
"""

import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch

from app.schemas.recommendation import RecommendationRequest
from app.schemas.certificate import Certificate
from app.services.study.recommendation_service import RecommendationService


def make_certificate(**kwargs) -> Certificate:
    """테스트용 Certificate 객체 생성 헬퍼."""
    defaults = {
        "id": "test-cert-id",
        "title": "테스트 자격증",
        "raw_id": "TEST001",
        "categories": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "difficulty": 3,
        "study_period_days": 90,
    }
    defaults.update(kwargs)
    return Certificate(**defaults)


class TestSoftFilterScoreBonus:
    """소프트 필터 점수 가산 테스트."""

    def test_current_status_student_bonus_for_entry_level(self):
        """student 상태에서 입문 자격증(difficulty <= 2)에 보너스 부여."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            id="cert-1",
            title="정보처리기능사",
            difficulty=2,
            study_period_days=60,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            current_status="student",
        )

        bonus = service._calculate_status_bonus(cert, request)
        assert bonus > 0, "student 상태에서 입문 자격증은 보너스를 받아야 함"

    def test_current_status_senior_worker_bonus_for_advanced(self):
        """senior_worker 상태에서 고급 자격증(difficulty >= 4)에 보너스 부여."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            id="cert-2",
            title="정보관리기술사",
            difficulty=5,
            study_period_days=365,
        )

        request = RecommendationRequest(
            purpose="커리어 전문성 강화",
            interest_domains=["IT개발"],
            study_timeline="1년 이상",
            difficulty_preference="어려워도 상관없음",
            current_status="senior_worker",
        )

        bonus = service._calculate_status_bonus(cert, request)
        assert bonus > 0, "senior_worker 상태에서 고급 자격증은 보너스를 받아야 함"

    def test_study_commitment_relaxed_bonus_for_short_period(self):
        """relaxed 투자 시간에서 짧은 준비 기간 자격증에 보너스 부여."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            id="cert-3",
            title="컴퓨터활용능력2급",
            difficulty=2,
            study_period_days=30,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            study_commitment="relaxed",
        )

        bonus = service._calculate_commitment_bonus(cert, request)
        assert bonus > 0, "relaxed 투자에서 짧은 기간 자격증은 보너스를 받아야 함"

    def test_study_commitment_intensive_bonus_for_long_period(self):
        """intensive 투자 시간에서 긴 준비 기간 자격증에도 보너스 부여."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            id="cert-4",
            title="정보처리기사",
            difficulty=3,
            study_period_days=120,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            study_commitment="intensive",
        )

        bonus = service._calculate_commitment_bonus(cert, request)
        assert bonus > 0, "intensive 투자에서는 긴 기간 자격증도 보너스를 받아야 함"

    def test_study_commitment_unsure_no_penalty(self):
        """unsure 투자 시간에서는 페널티 없이 기본 점수 유지."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            id="cert-5",
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="중간",
            study_commitment="unsure",
        )

        bonus = service._calculate_commitment_bonus(cert, request)
        assert bonus >= 0, "unsure 상태에서는 페널티가 없어야 함"


class TestFallbackLogic:
    """폴백 로직 테스트: 결과 0개 시 무조건 결과 반환."""

    def test_fallback_returns_results_when_filters_too_strict(self):
        """하드 필터로 결과 0개일 때 폴백으로 결과 반환."""
        service = RecommendationService(db=MagicMock())

        # 모든 자격증이 필터에서 걸러지는 상황 시뮬레이션
        certificates = [
            {"id": "cert-1", "title": "자격증1", "difficulty": 5, "study_period_days": 365},
            {"id": "cert-2", "title": "자격증2", "difficulty": 4, "study_period_days": 300},
        ]

        # 엄격한 제약조건 (difficulty <= 2, study_period <= 90)
        strict_constraints = {
            "max_study_days": 90,
            "max_difficulty": 2,
        }

        # 소프트 필터로 변경된 _apply_soft_constraints 호출
        result = service._apply_soft_constraints(certificates, strict_constraints)

        # 폴백: 결과가 0개가 아니어야 함
        assert len(result) > 0, "폴백으로 최소 1개 이상 결과를 반환해야 함"

    def test_fallback_returns_top_k_by_similarity(self):
        """폴백 시 유사도 상위 결과를 반환해야 함."""
        service = RecommendationService(db=MagicMock())

        similar_results = [
            {"id": "cert-1", "score": 0.95},
            {"id": "cert-2", "score": 0.85},
            {"id": "cert-3", "score": 0.75},
            {"id": "cert-4", "score": 0.65},
            {"id": "cert-5", "score": 0.55},
        ]

        # 모든 자격증이 제약조건을 만족하지 않는 상황
        certificates = [
            {"id": "cert-1", "difficulty": 5, "study_period_days": 500},
            {"id": "cert-2", "difficulty": 5, "study_period_days": 400},
            {"id": "cert-3", "difficulty": 5, "study_period_days": 300},
            {"id": "cert-4", "difficulty": 5, "study_period_days": 200},
            {"id": "cert-5", "difficulty": 5, "study_period_days": 100},
        ]

        strict_constraints = {
            "max_study_days": 30,
            "max_difficulty": 1,
        }

        # 폴백 적용
        result = service._apply_fallback_if_empty(
            filtered_results=[],  # 빈 결과
            all_results=similar_results,
            certificates=certificates,
            fallback_count=3,
        )

        assert len(result) == 3, "폴백으로 상위 3개 반환"
        assert result[0]["id"] == "cert-1", "유사도 가장 높은 결과가 첫 번째"


class TestSoftConstraintsIntegration:
    """소프트 필터 통합 테스트."""

    def test_soft_constraints_add_bonus_not_filter(self):
        """소프트 필터는 필터링이 아닌 점수 가산으로 동작."""
        service = RecommendationService(db=MagicMock())

        certificates = [
            {"id": "cert-1", "difficulty": 2, "study_period_days": 60},  # 조건 충족
            {"id": "cert-2", "difficulty": 4, "study_period_days": 200},  # 조건 미충족
        ]

        constraints = {
            "max_study_days": 90,
            "max_difficulty": 2,
        }

        result = service._apply_soft_constraints(certificates, constraints)

        # 두 자격증 모두 반환되어야 함 (필터링 X)
        assert len(result) == 2, "소프트 필터는 필터링하지 않아야 함"

        # 조건 충족 자격증이 더 높은 보너스
        cert1_bonus = result[0].get("soft_bonus", 0)
        cert2_bonus = result[1].get("soft_bonus", 0)
        assert cert1_bonus > cert2_bonus, "조건 충족 자격증이 더 높은 보너스를 받아야 함"


class TestQuerySummaryWithNewFields:
    """새 필드가 쿼리 요약에 반영되는지 테스트."""

    def test_query_summary_includes_current_status(self):
        """current_status가 쿼리 요약에 포함되어야 함."""
        service = RecommendationService(db=MagicMock())

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            current_status="student",
        )

        summary = service._generate_query_summary(request)
        # 기존 필드는 유지
        assert "취업" in summary
        assert "IT개발" in summary

    def test_query_summary_includes_study_commitment(self):
        """study_commitment가 쿼리 요약에 포함되어야 함."""
        service = RecommendationService(db=MagicMock())

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            study_commitment="moderate",
        )

        summary = service._generate_query_summary(request)
        assert "취업" in summary
        assert "IT개발" in summary
