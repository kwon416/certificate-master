"""RecommendationRequest 스키마 향상된 질문 필드 테스트.

전기기능장과 같은 특정 자격증을 정확하게 추천하기 위한 새 필드:
- target_jobs: 목표 직종 키워드 (예: ["전기기술자", "전기안전관리자"])
- target_industries: 산업 분야 키워드 (예: ["전기공사", "건설업"])
- certificate_level: 자격증 등급 선호 (기능장, 기사, 산업기사, 기능사, 상관없음)
- specific_keywords: 특정 키워드 (예: ["전기"])

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from pydantic import ValidationError

from app.schemas.recommendation import (
    RecommendationRequest,
    VALID_CERTIFICATE_LEVELS,
)


class TestTargetJobsField:
    """target_jobs 필드 테스트: 목표 직종 키워드."""

    def test_target_jobs_accepts_list_of_strings(self):
        """target_jobs는 문자열 리스트를 허용해야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_jobs=["전기기술자", "전기안전관리자", "전기공사 관리자"],
        )
        assert req.target_jobs == ["전기기술자", "전기안전관리자", "전기공사 관리자"]

    def test_target_jobs_is_optional(self):
        """target_jobs 필드는 선택 사항이어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.target_jobs is None

    def test_target_jobs_empty_list_becomes_none(self):
        """빈 리스트는 None으로 변환되어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            target_jobs=[],
        )
        assert req.target_jobs is None

    def test_target_jobs_whitespace_items_removed(self):
        """공백만 있는 항목은 제거되어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            target_jobs=["전기기술자", "  ", "", "전기안전관리자"],
        )
        assert req.target_jobs == ["전기기술자", "전기안전관리자"]


class TestTargetIndustriesField:
    """target_industries 필드 테스트: 산업 분야 키워드."""

    def test_target_industries_accepts_list_of_strings(self):
        """target_industries는 문자열 리스트를 허용해야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            target_industries=["전기공사", "제조업", "건설업"],
        )
        assert req.target_industries == ["전기공사", "제조업", "건설업"]

    def test_target_industries_is_optional(self):
        """target_industries 필드는 선택 사항이어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.target_industries is None


class TestCertificateLevelField:
    """certificate_level 필드 테스트: 자격증 등급 선호."""

    def test_valid_certificate_level_values(self):
        """유효한 certificate_level 값들이 허용되어야 함."""
        valid_values = ["기능장", "기사", "산업기사", "기능사", "상관없음"]

        for level in valid_values:
            req = RecommendationRequest(
                purpose="취업",
                interest_domains=["건설/건축"],
                study_timeline="6개월 이하",
                difficulty_preference="어려워도 상관없음",
                certificate_level=level,
            )
            assert req.certificate_level == level

    def test_certificate_level_is_optional(self):
        """certificate_level 필드는 선택 사항이어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.certificate_level is None

    def test_invalid_certificate_level_raises_error(self):
        """유효하지 않은 certificate_level 값은 ValidationError를 발생시켜야 함."""
        with pytest.raises(ValidationError) as exc_info:
            RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="3개월 이하",
                difficulty_preference="쉬운 편",
                certificate_level="무효한등급",
            )
        assert "certificate_level" in str(exc_info.value).lower()


class TestSpecificKeywordsField:
    """specific_keywords 필드 테스트: 특정 키워드."""

    def test_specific_keywords_accepts_list_of_strings(self):
        """specific_keywords는 문자열 리스트를 허용해야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            specific_keywords=["전기", "기능장"],
        )
        assert req.specific_keywords == ["전기", "기능장"]

    def test_specific_keywords_is_optional(self):
        """specific_keywords 필드는 선택 사항이어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )
        assert req.specific_keywords is None

    def test_specific_keywords_deduplicates(self):
        """중복 키워드는 제거되어야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            specific_keywords=["전기", "전기", "기능장"],
        )
        assert req.specific_keywords == ["전기", "기능장"]


class TestValidConstantsExported:
    """유효한 값 목록이 export 되어야 함."""

    def test_valid_certificate_levels_exported(self):
        """VALID_CERTIFICATE_LEVELS 상수가 export 되어야 함."""
        assert VALID_CERTIFICATE_LEVELS == [
            "기능장",
            "기사",
            "산업기사",
            "기능사",
            "상관없음",
        ]


class TestBackwardCompatibility:
    """하위 호환성 테스트."""

    def test_existing_request_still_works_with_new_fields(self):
        """기존 요청 형식이 여전히 작동해야 함."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발", "데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            user_summary="AI 개발자가 되고 싶습니다",
        )

        # 새 필드들은 None이어야 함
        assert req.target_jobs is None
        assert req.target_industries is None
        assert req.certificate_level is None
        assert req.specific_keywords is None


class TestElectricianCertificateScenario:
    """전기기능장 추천 시나리오 테스트.

    사용자가 전기기능장을 정확하게 추천받기 위한 요청 시나리오.
    """

    def test_electrician_request_with_all_new_fields(self):
        """전기기능장을 원하는 사용자의 완전한 요청."""
        req = RecommendationRequest(
            purpose="취업",
            interest_domains=["건설/건축", "생산"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            user_summary="전기 분야 최고급 자격증을 취득하고 싶습니다",
            current_status="senior_worker",
            study_commitment="intensive",
            # 새 필드
            target_jobs=["전기기술자", "전기안전관리자", "전기공사 관리자"],
            target_industries=["전기공사", "제조업", "건설업"],
            certificate_level="기능장",
            specific_keywords=["전기"],
        )

        assert req.target_jobs == ["전기기술자", "전기안전관리자", "전기공사 관리자"]
        assert req.target_industries == ["전기공사", "제조업", "건설업"]
        assert req.certificate_level == "기능장"
        assert req.specific_keywords == ["전기"]
