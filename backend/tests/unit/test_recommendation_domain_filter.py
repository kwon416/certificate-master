"""분야 기반 하드 필터 테스트.

IT개발 분야 선택 시 미용사, 항공사진기능사 등 무관한 자격증이
추천되는 문제를 해결하기 위한 분야 기반 필터링 테스트.

TDD: 먼저 테스트 작성, 실패 확인 후 최소 구현.
"""

import pytest
from unittest.mock import MagicMock

from app.schemas.recommendation import RecommendationRequest
from app.services.study.recommendation_service import RecommendationService


class TestDomainFilter:
    """분야 기반 필터링 테스트."""

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

    def test_filter_returns_matching_certificates(self, service, it_request):
        """IT개발 분야 요청 시 IT 관련 자격증만 반환해야 함.

        필터링 결과가 3개 이상이어야 폴백하지 않음.
        """
        certificates = [
            {
                "id": "cert1",
                "title": "정보처리기사",
                "career_info": {"industry": ["IT", "소프트웨어"]},
                "job_market_info": {"preferred_industries": ["정보기술"]},
            },
            {
                "id": "cert2",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용", "서비스"]},
                "job_market_info": {"preferred_industries": ["미용서비스"]},
            },
            {
                "id": "cert3",
                "title": "빅데이터분석기사",
                "career_info": {"industry": ["IT", "데이터"]},
                "job_market_info": {"preferred_industries": ["ICT"]},
            },
            {
                "id": "cert4",
                "title": "정보보안기사",
                "career_info": {"industry": ["IT", "보안"]},
                "job_market_info": {"preferred_industries": ["정보통신"]},
            },
            {
                "id": "cert5",
                "title": "컴퓨터활용능력",
                "career_info": {"industry": ["IT", "컴퓨터"]},
                "job_market_info": {"preferred_industries": ["사무"]},
            },
            {
                "id": "cert6",
                "title": "건설기사",
                "career_info": {"industry": ["건설"]},
                "job_market_info": {"preferred_industries": []},
            },
        ]

        filtered = service._apply_domain_filter(certificates, it_request)

        # IT 관련 자격증만 반환 (4개)
        assert len(filtered) == 4
        filtered_ids = [c["id"] for c in filtered]
        assert "cert1" in filtered_ids  # 정보처리기사 - IT
        assert "cert3" in filtered_ids  # 빅데이터분석기사 - IT/데이터
        assert "cert4" in filtered_ids  # 정보보안기사 - IT
        assert "cert5" in filtered_ids  # 컴퓨터활용능력 - IT
        assert "cert2" not in filtered_ids  # 미용사 제외
        assert "cert6" not in filtered_ids  # 건설기사 제외

    def test_filter_excludes_unrelated_certificates(self, service, it_request):
        """무관한 분야의 자격증은 제외되어야 함.

        2026-02-06 수정: 폴백 제거
        IT 관련 자격증이 0개이면 빈 리스트 반환 (무관 자격증 추천 방지)
        """
        certificates = [
            {
                "id": "cert1",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용", "피부관리"]},
                "job_market_info": {"preferred_industries": []},
            },
            {
                "id": "cert2",
                "title": "항공사진기능사",
                "career_info": {"industry": ["항공", "사진"]},
                "job_market_info": {"preferred_industries": []},
            },
        ]

        filtered = service._apply_domain_filter(certificates, it_request)

        # 2026-02-06: 폴백 제거, IT 관련 0개이면 빈 리스트 반환
        assert filtered == []

    def test_filter_with_multiple_domains(self, service, multi_domain_request):
        """여러 관심 분야에 매칭되는 자격증 모두 반환."""
        certificates = [
            {
                "id": "cert1",
                "title": "정보처리기사",
                "career_info": {"industry": ["IT", "소프트웨어"]},
                "job_market_info": {"preferred_industries": []},
            },
            {
                "id": "cert2",
                "title": "빅데이터분석기사",
                "career_info": {"industry": ["데이터", "AI"]},
                "job_market_info": {"preferred_industries": ["빅데이터"]},
            },
            {
                "id": "cert3",
                "title": "미용사",
                "career_info": {"industry": ["미용"]},
                "job_market_info": {"preferred_industries": []},
            },
            {
                "id": "cert4",
                "title": "데이터분석전문가",
                "career_info": {"industry": ["데이터", "분석"]},
                "job_market_info": {"preferred_industries": []},
            },
            {
                "id": "cert5",
                "title": "건축기사",
                "career_info": {"industry": ["건축"]},
                "job_market_info": {"preferred_industries": []},
            },
        ]

        filtered = service._apply_domain_filter(certificates, multi_domain_request)

        # IT개발 또는 데이터 관련 자격증만 반환 (3개)
        assert len(filtered) == 3
        filtered_ids = [c["id"] for c in filtered]
        assert "cert1" in filtered_ids  # IT
        assert "cert2" in filtered_ids  # 데이터/AI
        assert "cert4" in filtered_ids  # 데이터
        assert "cert3" not in filtered_ids  # 미용사 제외
        assert "cert5" not in filtered_ids  # 건축기사 제외

    def test_filter_with_medical_domain(self, service, mock_db):
        """의료 분야는 관련 자격증만 반환."""
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["의료"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )
        certificates = [
            {
                "id": "cert1",
                "career_info": {"industry": ["의료", "병원"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "career_info": {"industry": ["간호", "보건"]},
                "job_market_info": {},
            },
            {
                "id": "cert3",
                "career_info": {"industry": ["헬스케어"]},
                "job_market_info": {},
            },
            {
                "id": "cert4",
                "career_info": {"industry": ["IT"]},
                "job_market_info": {},
            },
        ]

        filtered = service._apply_domain_filter(certificates, request)

        # 의료 관련 자격증만 반환
        assert len(filtered) == 3
        filtered_ids = [c["id"] for c in filtered]
        assert "cert1" in filtered_ids  # 의료/병원
        assert "cert2" in filtered_ids  # 간호/보건
        assert "cert3" in filtered_ids  # 헬스케어

    def test_filter_handles_null_career_info(self, service, it_request):
        """career_info가 null인 자격증도 처리해야 함."""
        certificates = [
            {
                "id": "cert1",
                "title": "정보처리기사",
                "career_info": {"industry": ["IT"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "title": "자격증2",
                "career_info": None,  # null
                "job_market_info": None,
            },
            {
                "id": "cert3",
                "title": "자격증3",
                "career_info": {},  # 빈 객체
                "job_market_info": {},
            },
        ]

        # 에러 없이 실행되어야 함
        filtered = service._apply_domain_filter(certificates, it_request)

        # IT 관련만 반환 (결과가 3개 미만이면 폴백)
        assert len(filtered) >= 1

    def test_filter_keeps_single_match_no_fallback(self, service, it_request):
        """IT 관련 자격증이 1개만 있어도 그것만 반환 (폴백하지 않음).

        TDD: 무관한 자격증이 추천되는 문제를 해결하기 위해
        필터 결과가 1개라도 있으면 그 결과만 반환해야 함.
        """
        certificates = [
            {
                "id": "cert1",
                "title": "정보처리기사",
                "career_info": {"industry": ["IT"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용"]},
                "job_market_info": {},
            },
            {
                "id": "cert3",
                "title": "수산양식기사",
                "career_info": {"industry": ["수산"]},
                "job_market_info": {},
            },
            {
                "id": "cert4",
                "title": "한복기능사",
                "career_info": {"industry": ["패션", "한복"]},
                "job_market_info": {},
            },
        ]

        filtered = service._apply_domain_filter(certificates, it_request)

        # IT 관련은 1개뿐이지만, 그것만 반환 (폴백 안 함)
        assert len(filtered) == 1
        assert filtered[0]["id"] == "cert1"
        assert filtered[0]["title"] == "정보처리기사"

    def test_filter_keeps_two_matches_no_fallback(self, service, it_request):
        """IT 관련 자격증이 2개 있을 때도 폴백하지 않음."""
        certificates = [
            {
                "id": "cert1",
                "title": "정보처리기사",
                "career_info": {"industry": ["IT", "소프트웨어"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "title": "빅데이터분석기사",
                "career_info": {"industry": ["IT", "데이터"]},
                "job_market_info": {},
            },
            {
                "id": "cert3",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용"]},
                "job_market_info": {},
            },
            {
                "id": "cert4",
                "title": "기상예보기술사",
                "career_info": {"industry": ["기상"]},
                "job_market_info": {},
            },
            {
                "id": "cert5",
                "title": "호텔경영사",
                "career_info": {"industry": ["호텔", "관광"]},
                "job_market_info": {},
            },
        ]

        filtered = service._apply_domain_filter(certificates, it_request)

        # IT 관련 2개만 반환 (미용사, 기상예보기술사, 호텔경영사 제외)
        assert len(filtered) == 2
        filtered_ids = [c["id"] for c in filtered]
        assert "cert1" in filtered_ids  # 정보처리기사
        assert "cert2" in filtered_ids  # 빅데이터분석기사
        assert "cert3" not in filtered_ids  # 미용사(피부) 제외
        assert "cert4" not in filtered_ids  # 기상예보기술사 제외
        assert "cert5" not in filtered_ids  # 호텔경영사 제외

    def test_filter_no_fallback_returns_empty(self, service, it_request):
        """필터 결과가 0개일 때 빈 리스트 반환 (폴백 제거).

        2026-02-06 수정: 폴백 로직 제거
        무관한 자격증이 추천되는 것을 방지하기 위해
        매칭 결과가 0개이면 빈 리스트를 반환.
        """
        certificates = [
            {
                "id": "cert1",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "title": "수산양식기사",
                "career_info": {"industry": ["수산"]},
                "job_market_info": {},
            },
        ]

        filtered = service._apply_domain_filter(certificates, it_request)

        # 2026-02-06: 폴백 제거, IT 관련 0개이면 빈 리스트 반환
        assert filtered == []

    def test_medical_domain_excludes_beauty(self, service, mock_db):
        """의료 분야 선택 시 미용 관련 자격증은 제외되어야 함.

        TDD: "보건미용"이 "보건" 키워드와 매칭되어
        의료 분야에 미용사가 추천되는 문제 해결.
        """
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["의료"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )
        certificates = [
            {
                "id": "cert1",
                "title": "간호사",
                "career_info": {"industry": ["의료", "간호", "병원"]},
                "job_market_info": {},
            },
            {
                "id": "cert2",
                "title": "미용사(피부)",
                "career_info": {"industry": ["미용", "보건미용", "피부관리"]},
                "job_market_info": {},
            },
            {
                "id": "cert3",
                "title": "의료기기산업기사",
                "career_info": {"industry": ["의료", "의료기기"]},
                "job_market_info": {},
            },
            {
                "id": "cert4",
                "title": "미용사(일반)",
                "career_info": {"industry": ["미용", "헤어"]},
                "job_market_info": {},
            },
        ]

        filtered = service._apply_domain_filter(certificates, request)

        # 의료 관련만 반환, 미용 관련은 제외
        assert len(filtered) == 2
        filtered_ids = [c["id"] for c in filtered]
        assert "cert1" in filtered_ids  # 간호사
        assert "cert3" in filtered_ids  # 의료기기산업기사
        assert "cert2" not in filtered_ids  # 미용사(피부) 제외
        assert "cert4" not in filtered_ids  # 미용사(일반) 제외
