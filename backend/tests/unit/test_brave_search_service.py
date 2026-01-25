"""Unit tests for BraveSearchService.

TDD: RED phase - Writing tests first.
"""
from unittest.mock import AsyncMock, patch

import pytest


class TestBraveSearchService:
    """Tests for BraveSearchService."""

    def test_init_with_api_key(self):
        """Test service initialization with API key."""
        from app.services.brave_search import BraveSearchService

        service = BraveSearchService(api_key="test-api-key")
        assert service.api_key == "test-api-key"
        assert service.base_url.endswith("/web/search")

    @pytest.mark.asyncio
    async def test_search_requires_api_key(self):
        """Search should fail when API key is missing."""
        with patch("app.services.brave_search.get_settings") as mock_settings:
            mock_settings.return_value.BRAVE_API_KEY = None
            from app.services.brave_search import BraveSearchService

            service = BraveSearchService()
            with pytest.raises(ValueError, match="BRAVE_API_KEY not configured"):
                await service.search("테스트")

    def test_calculate_url_quality_prioritizes_official_sources(self):
        """URL quality should prioritize official domains."""
        from app.services.brave_search import BraveSearchService

        service = BraveSearchService(api_key="test-key")

        assert service._calculate_url_quality("https://www.q-net.or.kr") == 100
        assert service._calculate_url_quality("https://hrdkorea.or.kr") == 100
        assert service._calculate_url_quality("https://www.eduwill.net") == 90
        assert service._calculate_url_quality("https://www.hackers.com") == 90

    def test_calculate_recency_score_parses_age(self):
        """Recency score should parse age strings."""
        from app.services.brave_search import BraveSearchService

        service = BraveSearchService(api_key="test-key")

        assert service._calculate_recency_score("2 months ago") == 60
        assert service._calculate_recency_score("1 year ago") == 35
        assert service._calculate_recency_score("today") == 95

    def test_extract_results_keyword_hints_boost_relevance(self):
        """Keyword hints should boost ranking when matched."""
        from app.services.brave_search import BraveSearchService

        service = BraveSearchService(api_key="test-key")

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
        from app.services.brave_search import BraveSearchService

        service = BraveSearchService(api_key="test-key")

        with patch.object(
            service,
            "search",
            new_callable=AsyncMock,
            return_value={"web": {"results": []}},
        ) as mock_search, patch.object(
            service,
            "_extract_results",
            return_value=[],
        ) as mock_extract, patch(
            "app.services.brave_search.asyncio.sleep",
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

        for call in mock_extract.call_args_list:
            assert "keyword_hints" in call.kwargs
