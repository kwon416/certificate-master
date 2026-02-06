"""도메인 필터 엄격 모드 테스트.

IT개발 선택 시 미용사, 관광, 제과 등 무관 자격증이 추천되지 않도록
도메인 필터가 정확히 동작하는지 검증합니다.

Playwright 테스트에서 확인된 문제:
- IT개발 선택 → 제과기능장, 관광통역안내사, 호텔경영사 추천됨
- 디자인 선택 → 수산양식기사, 기상예보기술사 추천됨

근본 원인:
1. _apply_domain_filter() 폴백 로직: 매칭 0개면 원본 전체 반환
2. DOMAIN_INDUSTRY_MAPPING 키워드 부족
3. title, overview 매칭 범위 누락
"""

import pytest
from unittest.mock import MagicMock

from app.services.study.recommendation_service import (
    RecommendationService,
    DOMAIN_INDUSTRY_MAPPING,
    DOMAIN_EXCLUSION_KEYWORDS,
)
from app.schemas.recommendation import RecommendationRequest


class TestDomainFilterStrict:
    """도메인 필터 엄격 모드 테스트."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock DB 세션."""
        return MagicMock()

    @pytest.fixture
    def recommendation_service(self, mock_db_session):
        """추천 서비스 인스턴스."""
        return RecommendationService(db=mock_db_session)

    @pytest.fixture
    def it_dev_request(self):
        """IT개발 분야 추천 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    @pytest.fixture
    def design_request(self):
        """디자인 분야 추천 요청."""
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["디자인"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

    @pytest.fixture
    def unrelated_certificates(self):
        """IT개발/디자인과 무관한 자격증 목록."""
        return [
            {
                "id": "cert-1",
                "title": "제과기능장",
                "overview": "제과 및 제빵 기술을 평가하는 자격증",
                "career_info": {"industry": ["식품", "요식업"], "related_jobs": ["제과사", "파티시에"]},
                "job_market_info": {"preferred_industries": ["호텔", "베이커리"]},
            },
            {
                "id": "cert-2",
                "title": "관광통역안내사",
                "overview": "외국 관광객에게 한국 관광지를 안내하는 자격증",
                "career_info": {"industry": ["관광", "서비스"], "related_jobs": ["관광가이드", "통역사"]},
                "job_market_info": {"preferred_industries": ["여행사", "호텔"]},
            },
            {
                "id": "cert-3",
                "title": "수산양식기사",
                "overview": "수산물 양식 기술을 다루는 자격증",
                "career_info": {"industry": ["수산", "어업"], "related_jobs": ["양식업자", "수산연구원"]},
                "job_market_info": {"preferred_industries": ["수산업", "해양"]},
            },
            {
                "id": "cert-4",
                "title": "기상예보기술사",
                "overview": "기상 예보 및 분석 기술을 다루는 자격증",
                "career_info": {"industry": ["기상", "환경"], "related_jobs": ["기상예보관", "기상연구원"]},
                "job_market_info": {"preferred_industries": ["기상청", "환경부"]},
            },
            {
                "id": "cert-5",
                "title": "미용사(일반)",
                "overview": "헤어 미용 기술을 다루는 자격증",
                "career_info": {"industry": ["미용", "서비스"], "related_jobs": ["미용사", "헤어디자이너"]},
                "job_market_info": {"preferred_industries": ["미용실", "뷰티샵"]},
            },
        ]

    @pytest.fixture
    def it_related_certificates(self):
        """IT개발 관련 자격증 목록."""
        return [
            {
                "id": "cert-it-1",
                "title": "정보처리기사",
                "overview": "소프트웨어 개발 및 정보시스템 구축 능력을 평가하는 자격증",
                "career_info": {"industry": ["IT", "소프트웨어"], "related_jobs": ["개발자", "프로그래머", "시스템분석가"]},
                "job_market_info": {"preferred_industries": ["IT기업", "금융", "제조"]},
            },
            {
                "id": "cert-it-2",
                "title": "네트워크관리사",
                "overview": "네트워크 시스템 관리 및 보안 능력을 평가하는 자격증",
                "career_info": {"industry": ["IT", "정보통신"], "related_jobs": ["네트워크관리자", "시스템엔지니어"]},
                "job_market_info": {"preferred_industries": ["통신사", "IT기업"]},
            },
        ]

    @pytest.fixture
    def design_related_certificates(self):
        """디자인 관련 자격증 목록."""
        return [
            {
                "id": "cert-design-1",
                "title": "시각디자인기사",
                "overview": "시각디자인 분야의 전문 능력을 평가하는 자격증",
                "career_info": {"industry": ["디자인", "광고"], "related_jobs": ["그래픽디자이너", "아트디렉터"]},
                "job_market_info": {"preferred_industries": ["광고대행사", "디자인스튜디오"]},
            },
            {
                "id": "cert-design-2",
                "title": "컬러리스트기사",
                "overview": "색채 관련 전문 능력을 평가하는 자격증",
                "career_info": {"industry": ["디자인", "색채"], "related_jobs": ["컬러리스트", "색채컨설턴트"]},
                "job_market_info": {"preferred_industries": ["패션", "인테리어"]},
            },
        ]

    # ===== 핵심 테스트 케이스 =====

    def test_it_dev_filter_excludes_unrelated_certificates(
        self, recommendation_service, it_dev_request, unrelated_certificates
    ):
        """IT개발 선택 시 무관한 자격증(미용, 관광, 제과, 수산, 기상)이 제외되어야 함."""
        # When: IT개발 분야로 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(
            unrelated_certificates, it_dev_request
        )

        # Then: 무관한 자격증은 모두 제외되어 빈 리스트 반환
        assert len(filtered) == 0, (
            f"IT개발 분야 선택 시 무관 자격증이 제외되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )

    def test_design_filter_excludes_unrelated_certificates(
        self, recommendation_service, design_request, unrelated_certificates
    ):
        """디자인 선택 시 무관한 자격증(수산, 기상, 제과 등)이 제외되어야 함."""
        # When: 디자인 분야로 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(
            unrelated_certificates, design_request
        )

        # Then: 무관한 자격증은 모두 제외되어 빈 리스트 반환
        assert len(filtered) == 0, (
            f"디자인 분야 선택 시 무관 자격증이 제외되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )

    def test_it_dev_filter_includes_related_certificates(
        self, recommendation_service, it_dev_request, it_related_certificates
    ):
        """IT개발 선택 시 관련 자격증(정보처리기사, 네트워크관리사)은 포함되어야 함."""
        # When: IT개발 분야로 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(
            it_related_certificates, it_dev_request
        )

        # Then: IT 관련 자격증은 모두 포함
        assert len(filtered) == 2, (
            f"IT개발 분야 선택 시 관련 자격증은 포함되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )
        titles = [c["title"] for c in filtered]
        assert "정보처리기사" in titles
        assert "네트워크관리사" in titles

    def test_design_filter_includes_related_certificates(
        self, recommendation_service, design_request, design_related_certificates
    ):
        """디자인 선택 시 관련 자격증(시각디자인기사, 컬러리스트)은 포함되어야 함."""
        # When: 디자인 분야로 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(
            design_related_certificates, design_request
        )

        # Then: 디자인 관련 자격증은 모두 포함
        assert len(filtered) == 2, (
            f"디자인 분야 선택 시 관련 자격증은 포함되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )
        titles = [c["title"] for c in filtered]
        assert "시각디자인기사" in titles
        assert "컬러리스트기사" in titles

    def test_mixed_certificates_filter_correctly(
        self,
        recommendation_service,
        it_dev_request,
        unrelated_certificates,
        it_related_certificates,
    ):
        """IT개발 선택 시 혼합 목록에서 관련 자격증만 필터링되어야 함."""
        # Given: 무관 자격증 + IT 관련 자격증 혼합
        mixed_certificates = unrelated_certificates + it_related_certificates

        # When: IT개발 분야로 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(
            mixed_certificates, it_dev_request
        )

        # Then: IT 관련 자격증만 포함
        assert len(filtered) == 2, (
            f"혼합 목록에서 IT 관련 자격증만 반환되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )
        titles = [c["title"] for c in filtered]
        assert "정보처리기사" in titles
        assert "네트워크관리사" in titles
        # 무관 자격증 제외 확인
        assert "제과기능장" not in titles
        assert "관광통역안내사" not in titles
        assert "수산양식기사" not in titles

    # ===== title/overview 매칭 테스트 =====

    def test_title_keyword_matching(self, recommendation_service, it_dev_request):
        """자격증 제목에 분야 키워드가 있으면 매칭되어야 함."""
        # Given: 제목에 IT 키워드가 포함된 자격증
        certificates = [
            {
                "id": "cert-title-1",
                "title": "전자계산기조직응용기사",  # "전자계산" 키워드
                "overview": "일반 개요",
                "career_info": {"industry": [], "related_jobs": []},
                "job_market_info": {"preferred_industries": []},
            },
        ]

        # When: 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(certificates, it_dev_request)

        # Then: 제목 키워드로 매칭되어 포함
        assert len(filtered) == 1, (
            f"제목에 IT 키워드('전자계산')가 있으면 포함되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )

    def test_overview_keyword_matching(self, recommendation_service, it_dev_request):
        """자격증 개요에 분야 키워드가 있으면 매칭되어야 함."""
        # Given: 개요에 IT 키워드가 포함된 자격증
        certificates = [
            {
                "id": "cert-overview-1",
                "title": "일반자격증",
                "overview": "컴퓨터 프로그래밍 및 소프트웨어 개발 능력을 평가",
                "career_info": {"industry": [], "related_jobs": []},
                "job_market_info": {"preferred_industries": []},
            },
        ]

        # When: 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(certificates, it_dev_request)

        # Then: 개요 키워드로 매칭되어 포함
        assert len(filtered) == 1, (
            f"개요에 IT 키워드('프로그래밍', '소프트웨어')가 있으면 포함되어야 함. "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )


class TestDomainIndustryMappingExpansion:
    """DOMAIN_INDUSTRY_MAPPING 확장 테스트."""

    def test_it_dev_has_expanded_keywords(self):
        """IT개발 분야에 확장된 키워드가 포함되어야 함."""
        it_keywords = DOMAIN_INDUSTRY_MAPPING.get("IT개발", [])

        # 기존 키워드
        assert "IT" in it_keywords
        assert "소프트웨어" in it_keywords
        assert "개발" in it_keywords

        # 확장 키워드 (계획에 따른 추가)
        expected_new_keywords = [
            "프로그래밍", "시스템", "전자계산", "네트워크", "보안",
            "웹", "앱", "데이터베이스", "서버", "클라우드",
            "리눅스", "정보처리", "전산"
        ]
        for keyword in expected_new_keywords:
            assert keyword in it_keywords, f"IT개발 키워드에 '{keyword}'가 포함되어야 함"

    def test_design_has_expanded_keywords(self):
        """디자인 분야에 확장된 키워드가 포함되어야 함."""
        design_keywords = DOMAIN_INDUSTRY_MAPPING.get("디자인", [])

        # 기존 키워드
        assert "디자인" in design_keywords
        assert "UX" in design_keywords
        assert "UI" in design_keywords

        # 확장 키워드 (계획에 따른 추가)
        expected_new_keywords = [
            "편집디자인", "광고디자인", "제품디자인", "색채", "컬러리스트",
            "일러스트", "영상편집", "3D", "CAD"
        ]
        for keyword in expected_new_keywords:
            assert keyword in design_keywords, f"디자인 키워드에 '{keyword}'가 포함되어야 함"


class TestDomainExclusionKeywordsExpansion:
    """DOMAIN_EXCLUSION_KEYWORDS 확장 테스트."""

    def test_it_dev_has_expanded_exclusion_keywords(self):
        """IT개발 분야에 확장된 제외 키워드가 포함되어야 함."""
        exclusion_keywords = DOMAIN_EXCLUSION_KEYWORDS.get("IT개발", [])

        # 기존 키워드
        assert "가공" in exclusion_keywords
        assert "용접" in exclusion_keywords
        assert "기계" in exclusion_keywords

        # 확장 키워드 (계획에 따른 추가)
        expected_new_keywords = [
            "금속", "목공", "제과", "조리", "미용",
            "관광", "수산", "기상", "호텔"
        ]
        for keyword in expected_new_keywords:
            assert keyword in exclusion_keywords, f"IT개발 제외 키워드에 '{keyword}'가 포함되어야 함"

    def test_design_has_exclusion_keywords(self):
        """디자인 분야에 제외 키워드가 포함되어야 함."""
        exclusion_keywords = DOMAIN_EXCLUSION_KEYWORDS.get("디자인", [])

        # 디자인 제외 키워드 (계획에 따른 추가)
        expected_keywords = [
            "기계", "전기", "화학", "건설", "용접",
            "의료", "수산", "기상", "양식"
        ]
        for keyword in expected_keywords:
            assert keyword in exclusion_keywords, f"디자인 제외 키워드에 '{keyword}'가 포함되어야 함"

    def test_data_has_exclusion_keywords(self):
        """데이터 분야에 제외 키워드가 포함되어야 함."""
        exclusion_keywords = DOMAIN_EXCLUSION_KEYWORDS.get("데이터", [])

        # 데이터 제외 키워드 (계획에 따른 추가)
        expected_keywords = ["가공", "용접", "기계가공", "금속", "제조", "수산", "기상"]
        for keyword in expected_keywords:
            assert keyword in exclusion_keywords, f"데이터 제외 키워드에 '{keyword}'가 포함되어야 함"


class TestNoFallbackBehavior:
    """폴백 제거 후 빈 리스트 반환 테스트."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock DB 세션."""
        return MagicMock()

    @pytest.fixture
    def recommendation_service(self, mock_db_session):
        """추천 서비스 인스턴스."""
        return RecommendationService(db=mock_db_session)

    def test_no_fallback_returns_empty_list(self, recommendation_service):
        """매칭 결과 0개일 때 원본 반환 대신 빈 리스트 반환."""
        # Given: IT개발 요청과 전혀 무관한 자격증만 있음
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

        unrelated_only = [
            {
                "id": "cert-1",
                "title": "한식조리기능사",
                "overview": "한식 조리 기술을 다루는 자격증",
                "career_info": {"industry": ["요식업", "조리"], "related_jobs": ["조리사"]},
                "job_market_info": {"preferred_industries": ["식당", "호텔"]},
            },
        ]

        # When: 도메인 필터 적용
        filtered = recommendation_service._apply_domain_filter(unrelated_only, request)

        # Then: 폴백 없이 빈 리스트 반환 (기존에는 원본 반환)
        assert len(filtered) == 0, (
            f"매칭 결과 0개일 때 빈 리스트를 반환해야 함 (폴백 제거). "
            f"실제 반환: {[c['title'] for c in filtered]}"
        )
