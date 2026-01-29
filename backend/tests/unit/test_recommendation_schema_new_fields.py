"""RecommendationRequest 스키마에 새 필드 (current_status, study_commitment) 추가 테스트.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from pydantic import ValidationError

from app.schemas.recommendation import (
    RecommendationRequest,
    VALID_CURRENT_STATUS,
    VALID_STUDY_COMMITMENT,
)


class TestCurrentStatusField:
    """current_status 필드 테스트."""

    def test_valid_current_status_values(self):
        """유효한 current_status 값들이 허용되어야 함."""
        valid_values = ["student", "entry_jobseeker", "junior_worker", "senior_worker", "career_break"]

        for status in valid_values:
            req = RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="3개월 이하",
                difficulty_preference="쉬운 편",
                current_status=status,
            )
            assert req.current_status == status

    def test_current_status_is_optional(self):
        """current_status 필드는 선택 사항이어야 함 (하위 호환성)."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.current_status is None

    def test_invalid_current_status_raises_error(self):
        """유효하지 않은 current_status 값은 ValidationError를 발생시켜야 함."""
        with pytest.raises(ValidationError) as exc_info:
            RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="3개월 이하",
                difficulty_preference="쉬운 편",
                current_status="invalid_status",
            )
        assert "current_status" in str(exc_info.value).lower()


class TestStudyCommitmentField:
    """study_commitment 필드 테스트."""

    def test_valid_study_commitment_values(self):
        """유효한 study_commitment 값들이 허용되어야 함."""
        valid_values = ["relaxed", "moderate", "intensive", "unsure"]

        for commitment in valid_values:
            req = RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="3개월 이하",
                difficulty_preference="쉬운 편",
                study_commitment=commitment,
            )
            assert req.study_commitment == commitment

    def test_study_commitment_is_optional(self):
        """study_commitment 필드는 선택 사항이어야 함 (하위 호환성)."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.study_commitment is None

    def test_invalid_study_commitment_raises_error(self):
        """유효하지 않은 study_commitment 값은 ValidationError를 발생시켜야 함."""
        with pytest.raises(ValidationError) as exc_info:
            RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="3개월 이하",
                difficulty_preference="쉬운 편",
                study_commitment="invalid_commitment",
            )
        assert "study_commitment" in str(exc_info.value).lower()


class TestValidConstantsExported:
    """유효한 값 목록이 export 되어야 함."""

    def test_valid_current_status_exported(self):
        """VALID_CURRENT_STATUS 상수가 export 되어야 함."""
        assert VALID_CURRENT_STATUS == [
            "student",
            "entry_jobseeker",
            "junior_worker",
            "senior_worker",
            "career_break",
        ]

    def test_valid_study_commitment_exported(self):
        """VALID_STUDY_COMMITMENT 상수가 export 되어야 함."""
        assert VALID_STUDY_COMMITMENT == [
            "relaxed",
            "moderate",
            "intensive",
            "unsure",
        ]


class TestBackwardCompatibility:
    """하위 호환성 테스트."""

    def test_existing_request_still_works(self):
        """기존 요청 형식이 여전히 작동해야 함."""
        # 기존 필드만 사용
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발", "데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            user_summary="AI 개발자가 되고 싶습니다",
        )

        assert req.purpose == "취업"
        assert req.interest_domains == ["IT개발", "데이터"]
        assert req.study_timeline == "6개월 이하"
        assert req.difficulty_preference == "중간"
        assert req.user_summary == "AI 개발자가 되고 싶습니다"
        # 새 필드는 None
        assert req.current_status is None
        assert req.study_commitment is None

    def test_new_request_with_all_fields(self):
        """모든 필드를 포함한 새 요청 형식도 작동해야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            user_summary="취업 준비 중입니다",
            current_status="student",
            study_commitment="moderate",
        )

        assert req.current_status == "student"
        assert req.study_commitment == "moderate"
