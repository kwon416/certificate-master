"""Unit tests for recommendation schemas (intent-first flow)."""
import pytest
from datetime import datetime
from pydantic import ValidationError


class TestRecommendationRequestSchema:
    """Test RecommendationRequest schema validation."""

    def test_recommendation_request_all_fields(self):
        """Test RecommendationRequest with all fields populated."""
        from app.schemas.recommendation import RecommendationRequest

        data = {
            "purpose": "취업",
            "interest_domains": ["IT개발", "데이터"],
            "study_timeline": "6개월 이하",
            "difficulty_preference": "중간",
            "user_summary": "데이터 분석 직무로 이직하고싶어",
        }

        request = RecommendationRequest(**data)

        assert request.purpose == "취업"
        assert request.interest_domains == ["IT개발", "데이터"]
        assert request.study_timeline == "6개월 이하"
        assert request.difficulty_preference == "중간"
        assert "데이터 분석 직무" in request.user_summary

    def test_recommendation_request_required_fields(self):
        """Test that core fields are required, user_summary optional."""
        from app.schemas.recommendation import RecommendationRequest

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )
        assert request.user_summary is None

    def test_recommendation_request_invalid_interest_domains(self):
        """Test validation for interest_domains values."""
        from app.schemas.recommendation import RecommendationRequest

        with pytest.raises(ValidationError):
            RecommendationRequest(
                purpose="취업",
                interest_domains=["잘못된 분야"],
                study_timeline="6개월 이하",
                difficulty_preference="중간",
                user_summary="테스트 요약",
            )

    def test_recommendation_request_invalid_timeline_or_difficulty(self):
        """Test validation for study_timeline and difficulty_preference."""
        from app.schemas.recommendation import RecommendationRequest

        with pytest.raises(ValidationError):
            RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="2주 이내",  # invalid
                difficulty_preference="중간",
                user_summary="테스트 요약",
            )

        with pytest.raises(ValidationError):
            RecommendationRequest(
                purpose="취업",
                interest_domains=["IT개발"],
                study_timeline="6개월 이하",
                difficulty_preference="아주 쉬움",  # invalid
                user_summary="테스트 요약",
            )

    def test_recommendation_request_dedup_interest_domains(self):
        """Test that duplicate domains are deduplicated while preserving order."""
        from app.schemas.recommendation import RecommendationRequest

        request = RecommendationRequest(
            purpose="커리어 전문성 강화",
            interest_domains=["IT개발", "IT개발", "데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="어려워도 상관없음",
            user_summary="중급 난이도의 자격증을 찾습니다.",
        )

        assert request.interest_domains == ["IT개발", "데이터"]

    def test_recommendation_request_allows_empty_user_summary(self):
        """user_summary can be empty/whitespace and becomes None."""
        from app.schemas.recommendation import RecommendationRequest

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="쉬운 편",
            user_summary="   ",
        )
        assert request.user_summary is None


class TestFeasibilitySchema:
    """Test Feasibility schema validation."""

    def test_feasibility_all_fields(self):
        """Test Feasibility with all fields."""
        from app.schemas.recommendation import Feasibility

        data = {
            "can_prepare": True,
            "estimated_days": 90,
        }

        feasibility = Feasibility(**data)

        assert feasibility.can_prepare is True
        assert feasibility.estimated_days == 90

    def test_feasibility_cannot_prepare(self):
        """Test Feasibility when cannot prepare."""
        from app.schemas.recommendation import Feasibility

        data = {
            "can_prepare": False,
            "estimated_days": 365,
        }

        feasibility = Feasibility(**data)

        assert feasibility.can_prepare is False
        assert feasibility.estimated_days == 365


class TestRecommendedCertificateSchema:
    """Test RecommendedCertificate schema validation."""

    def test_recommended_certificate_all_fields(self):
        """Test RecommendedCertificate with all fields."""
        from app.schemas.recommendation import RecommendedCertificate, Feasibility
        from app.schemas.certificate import Certificate

        cert_data = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "raw_id": "T_정보처리기사",
            "categories": [{"code": "T", "name": "국가기술자격"}],
            "series": "정보기술",
            "title": "정보처리기사",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        data = {
            "certificate": cert_data,
            "qualification_category": "국가기술자격",
            "match_score": 95,
            "recommendation_reason": "데이터/IT 분야 이직 준비에 적합합니다.",
            "key_points": [
                "중급 난이도",
                "6개월 이하 준비 가능",
                "관련 직무 활용도 높음",
            ],
            "feasibility": {
                "can_prepare": True,
                "estimated_days": 90,
            },
        }

        rec = RecommendedCertificate(**data)

        assert rec.match_score == 95
        assert "이직" in rec.recommendation_reason
        assert len(rec.key_points) == 3
        assert rec.feasibility.can_prepare is True
        assert rec.feasibility.estimated_days == 90

    def test_recommended_certificate_match_score_range(self):
        """Test that match_score must be between 0 and 100."""
        from app.schemas.recommendation import RecommendedCertificate

        cert_data = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "raw_id": "T_정보처리기사",
            "categories": [{"code": "T", "name": "국가기술자격"}],
            "series": "정보기술",
            "title": "정보처리기사",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        with pytest.raises(ValidationError):
            RecommendedCertificate(
                certificate=cert_data,
                qualification_category="국가기술자격",
                match_score=150,
                recommendation_reason="테스트",
                key_points=[],
                feasibility={"can_prepare": True, "estimated_days": 90},
            )

        with pytest.raises(ValidationError):
            RecommendedCertificate(
                certificate=cert_data,
                qualification_category="국가기술자격",
                match_score=-10,
                recommendation_reason="테스트",
                key_points=[],
                feasibility={"can_prepare": True, "estimated_days": 90},
            )


class TestRecommendationResponseSchema:
    """Test RecommendationResponse schema validation."""

    def test_recommendation_response_all_fields(self):
        """Test RecommendationResponse with all fields."""
        from app.schemas.recommendation import RecommendationResponse

        data = {
            "recommendations": [
                {
                    "certificate": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "raw_id": "T_정보처리기사",
                        "categories": [{"code": "T", "name": "국가기술자격"}],
                        "series": "정보기술",
                        "title": "정보처리기사",
                        "created_at": datetime.now(),
                        "updated_at": datetime.now(),
                    },
                    "qualification_category": "국가기술자격",
                    "match_score": 95,
                    "recommendation_reason": "데이터 분야 이직 준비에 적합합니다.",
                    "key_points": ["중급 난이도"],
                    "feasibility": {"can_prepare": True, "estimated_days": 90},
                }
            ],
            "query_summary": "취업 목적 | 관심 분야: IT개발, 데이터 | 준비 기간: 6개월 이하 | 난이도 선호: 중간",
            "total_matched": 15,
        }

        response = RecommendationResponse(**data)

        assert len(response.recommendations) == 1
        assert "관심 분야" in response.query_summary
        assert response.total_matched == 15

    def test_recommendation_response_empty_recommendations(self):
        """Test RecommendationResponse with no recommendations."""
        from app.schemas.recommendation import RecommendationResponse

        data = {
            "recommendations": [],
            "query_summary": "조건에 맞는 자격증을 찾지 못했습니다.",
            "total_matched": 0,
        }

        response = RecommendationResponse(**data)

        assert len(response.recommendations) == 0
        assert response.total_matched == 0

    def test_recommendation_response_with_user_summary(self):
        """Test RecommendationResponse includes user_summary field."""
        from app.schemas.recommendation import RecommendationResponse

        data = {
            "recommendations": [],
            "query_summary": "취업 목적 | 관심 분야: IT개발",
            "user_summary": "데이터 분석 직무로 이직하고싶어",
            "total_matched": 0,
        }

        response = RecommendationResponse(**data)

        assert response.user_summary == "데이터 분석 직무로 이직하고싶어"
        assert response.query_summary == "취업 목적 | 관심 분야: IT개발"

    def test_recommendation_response_user_summary_optional(self):
        """Test RecommendationResponse user_summary is optional (None)."""
        from app.schemas.recommendation import RecommendationResponse

        data = {
            "recommendations": [],
            "query_summary": "취업 목적 | 관심 분야: IT개발",
            "total_matched": 0,
        }

        response = RecommendationResponse(**data)

        assert response.user_summary is None


# ===== 통합 추천 스키마 테스트 =====


def test_unified_request_valid():
    """유효한 통합 추천 요청."""
    from app.schemas.recommendation import UnifiedRecommendationRequest

    req = UnifiedRecommendationRequest(
        domains=["IT/소프트웨어"],
        user_input="비전공자인데 3개월 안에 딸 수 있는 IT 자격증 추천해주세요",
    )
    assert req.domains == ["IT/소프트웨어"]
    assert len(req.user_input) >= 10


def test_unified_request_multiple_domains():
    """복수 도메인 선택."""
    from app.schemas.recommendation import UnifiedRecommendationRequest

    req = UnifiedRecommendationRequest(
        domains=["IT/소프트웨어", "전기/전자"],
        user_input="IT나 전기 쪽 자격증을 준비하고 싶습니다",
    )
    assert len(req.domains) == 2


def test_unified_request_empty_domains_allowed():
    """도메인이 비어있어도 허용된다 (자동 추론 모드)."""
    from app.schemas.recommendation import UnifiedRecommendationRequest

    req = UnifiedRecommendationRequest(
        domains=[],
        user_input="테스트 입력입니다 충분히 길게",
    )
    assert req.domains == []


def test_unified_request_short_input_fails():
    """user_input이 10자 미만이면 실패."""
    from app.schemas.recommendation import UnifiedRecommendationRequest

    with pytest.raises(ValidationError):
        UnifiedRecommendationRequest(
            domains=["IT/소프트웨어"],
            user_input="짧음",
        )
