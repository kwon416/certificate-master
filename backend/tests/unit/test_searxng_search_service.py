"""Unit tests for SearXNGSearchService.

TDD: 검색 서비스 테스트 (SearXNG 전용).
"""
from unittest.mock import AsyncMock, patch

import pytest


class TestSearXNGSearchService:
    """Tests for SearXNGSearchService."""

    def test_init_with_base_url(self):
        """Test service initialization with base URL."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService(base_url="http://localhost:8888")
        assert service.base_url == "http://localhost:8888"
        assert service.provider_name == "searxng"

    def test_calculate_url_quality_prioritizes_official_sources(self):
        """URL quality should prioritize official domains."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()

        assert service._calculate_url_quality("https://www.q-net.or.kr") == 100
        assert service._calculate_url_quality("https://hrdkorea.or.kr") == 100
        assert service._calculate_url_quality("https://www.eduwill.net") == 90
        assert service._calculate_url_quality("https://www.hackers.com") == 90

    def test_calculate_recency_score_parses_age(self):
        """Recency score should parse age strings."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()

        assert service._calculate_recency_score("2 months ago") == 60
        assert service._calculate_recency_score("1 year ago") == 35
        assert service._calculate_recency_score("today") == 95

    def test_extract_results_keyword_hints_boost_relevance(self):
        """Keyword hints should boost ranking when matched."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()

        api_response = {
            "web": {
                "results": [
                    {
                        "title": "기본 정보",
                        "url": "https://example.com/info",
                        "description": "일반 설명입니다.",
                        "age": "",
                    },
                    {
                        "title": "합격률 통계",
                        "url": "https://example.com/stats",
                        "description": "합격률 관련 데이터 포함",
                        "age": "",
                    },
                ]
            }
        }

        results = service._extract_results(
            api_response,
            keyword_hints=["합격률", "통계"],
        )

        assert results[0]["title"] == "합격률 통계"
        assert results[0]["keyword_score"] > results[1]["keyword_score"]

    @pytest.mark.asyncio
    async def test_search_study_plan_context_runs_all_queries(self):
        """Study plan search should call all categories with hints."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()

        with patch.object(
            service,
            "search",
            new_callable=AsyncMock,
            return_value={"web": {"results": []}},
        ) as mock_search, patch.object(
            service,
            "_extract_results",
            return_value=[],
        ), patch(
            "app.services.search.searxng_search.asyncio.sleep",
            new_callable=AsyncMock,
        ):
            results = await service.search_study_plan_context(
                "정보처리기사",
                delay_seconds=0,
            )

        assert "exam_schedule" in results
        assert "study_plan_examples" in results
        assert "time_allocation" in results
        assert mock_search.call_count == len(results)

    def test_comprehensive_queries_include_job_seeker_categories(self):
        """종합 검색에 취업준비생 관점 카테고리가 포함되어야 함."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()
        queries = service._build_comprehensive_queries("정보처리기사")

        # 취업준비생 필수 카테고리 확인
        job_seeker_categories = [
            "job_postings",      # 채용공고 우대/필수
            "public_sector",     # 공무원/공기업 가산점
            "cost_breakdown",    # 총 비용 (교재+인강+응시료)
            "non_major_reviews", # 비전공자/직장인 합격기
            "free_resources",    # 기출문제/무료 자료
            "comparison",        # 유사 자격증 비교
        ]

        for category in job_seeker_categories:
            assert category in queries, f"Missing category: {category}"
            assert "query" in queries[category]
            assert "keywords" in queries[category]

    def test_job_postings_query_includes_employment_keywords(self):
        """채용공고 카테고리에 취업 관련 키워드가 포함되어야 함."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()
        queries = service._build_comprehensive_queries("정보처리기사")

        job_query = queries["job_postings"]
        assert "채용" in job_query["query"] or "우대" in job_query["query"]
        assert any(
            kw in job_query["keywords"]
            for kw in ["채용", "우대", "필수", "가산점"]
        )

    def test_public_sector_query_includes_government_keywords(self):
        """공무원/공기업 카테고리에 관련 키워드가 포함되어야 함."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()
        queries = service._build_comprehensive_queries("정보처리기사")

        public_query = queries["public_sector"]
        assert any(
            kw in public_query["query"]
            for kw in ["공무원", "공기업", "가산점"]
        )
        assert any(
            kw in public_query["keywords"]
            for kw in ["공무원", "공기업", "가산점"]
        )

    def test_cost_breakdown_query_includes_expense_keywords(self):
        """비용 카테고리에 비용 관련 키워드가 포함되어야 함."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()
        queries = service._build_comprehensive_queries("정보처리기사")

        cost_query = queries["cost_breakdown"]
        assert any(
            kw in cost_query["query"]
            for kw in ["비용", "가격", "응시료"]
        )
        assert any(
            kw in cost_query["keywords"]
            for kw in ["비용", "가격", "교재", "인강"]
        )

    def test_url_quality_prioritizes_job_sites(self):
        """URL 품질 점수에 채용 사이트가 우선순위로 포함되어야 함."""
        from app.services.search.searxng_search import SearXNGSearchService

        service = SearXNGSearchService()

        # 채용 사이트는 높은 점수 (90점 이상)
        assert service._calculate_url_quality("https://www.saramin.co.kr") >= 90
        assert service._calculate_url_quality("https://www.jobkorea.co.kr") >= 90
        assert service._calculate_url_quality("https://www.wanted.co.kr") >= 90
