"""SearXNG 메타 검색 엔진 통합 서비스.

이 모듈은 SearXNG을 사용하여 자격증 정보를 검색하는 기능을 제공합니다.
SearXNG은 오픈소스 메타 검색 엔진으로, Brave Search API의 무료 대안입니다.

설치:
    docker run -d -p 8888:8080 searxng/searxng

사용법:
    SEARCH_PROVIDER=searxng uv run python -m scripts.data_pipeline
"""
import asyncio
import logging
from typing import Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class SearXNGSearchService:
    """SearXNG 메타 검색 엔진 통합 서비스.

    SearchServiceProtocol을 구현합니다.
    Brave Search API와 호환되는 결과 형식을 반환합니다.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        """SearXNG 검색 서비스를 초기화합니다.

        Args:
            base_url: SearXNG 서버 URL. 제공되지 않으면 설정 값을 사용합니다.
            timeout: 요청 타임아웃(초). 제공되지 않으면 설정 값을 사용합니다.
        """
        settings = get_settings()
        self.base_url = base_url or settings.SEARXNG_BASE_URL
        self.timeout = timeout or settings.SEARXNG_TIMEOUT
        self._provider_name = "searxng"

    @property
    def provider_name(self) -> str:
        """검색 서비스 제공자 이름을 반환합니다.

        Returns:
            제공자 이름 ("searxng").
        """
        return self._provider_name

    async def search(
        self,
        query: str,
        count: int = 5,
        country: str = "KR",
        search_lang: str = "ko",
    ) -> dict:
        """SearXNG으로 검색합니다.

        Args:
            query: 검색 질의 문자열.
            count: 반환할 결과 수(기본값: 5).
            country: 지역화 결과를 위한 국가 코드(기본값: KR).
            search_lang: 검색 언어(기본값: ko).

        Returns:
            Brave API 호환 형식의 검색 결과 딕셔너리:
            {
                "web": {
                    "results": [...]
                }
            }

        Raises:
            httpx.HTTPError: API 요청이 실패한 경우.
        """
        # SearXNG 언어 코드 매핑
        language_map = {
            "ko": "ko-KR",
            "en": "en-US",
            "ja": "ja-JP",
            "zh": "zh-CN",
        }
        language = language_map.get(search_lang, f"{search_lang}-{country}")

        params = {
            "q": query,
            "format": "json",
            "language": language,
            "pageno": 1,
            "safesearch": 0,
            "categories": "general",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/search",
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()

        # SearXNG 결과를 Brave API 형식으로 변환
        results = data.get("results", [])[:count]
        brave_format_results = []

        for result in results:
            brave_format_results.append({
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "description": result.get("content", ""),
                "age": self._parse_publish_date(result.get("publishedDate", "")),
                "language": search_lang,
            })

        return {
            "web": {
                "results": brave_format_results,
            }
        }

    def _parse_publish_date(self, date_str: str) -> str:
        """발행일을 상대적 시간 문자열로 변환합니다.

        Args:
            date_str: ISO 형식 또는 기타 날짜 문자열.

        Returns:
            "2 days ago" 같은 상대적 시간 문자열.
        """
        if not date_str:
            return ""

        try:
            from datetime import datetime, timezone

            # ISO 형식 파싱 시도
            if "T" in date_str:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            else:
                # 다른 형식 시도
                for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"]:
                    try:
                        dt = datetime.strptime(date_str, fmt).replace(
                            tzinfo=timezone.utc
                        )
                        break
                    except ValueError:
                        continue
                else:
                    return date_str

            now = datetime.now(timezone.utc)
            diff = now - dt

            if diff.days == 0:
                if diff.seconds < 3600:
                    return f"{diff.seconds // 60} minutes ago"
                return f"{diff.seconds // 3600} hours ago"
            elif diff.days == 1:
                return "1 day ago"
            elif diff.days < 7:
                return f"{diff.days} days ago"
            elif diff.days < 30:
                weeks = diff.days // 7
                return f"{weeks} week{'s' if weeks > 1 else ''} ago"
            elif diff.days < 365:
                months = diff.days // 30
                return f"{months} month{'s' if months > 1 else ''} ago"
            else:
                years = diff.days // 365
                return f"{years} year{'s' if years > 1 else ''} ago"

        except Exception:
            return date_str

    async def search_certificate_comprehensive(
        self, certificate_title: str
    ) -> dict[str, list[dict]]:
        """여러 쿼리로 자격증 정보를 종합 검색합니다.

        Args:
            certificate_title: 자격증 한글명.

        Returns:
            카테고리별 검색 결과 딕셔너리.
        """
        settings = get_settings()
        queries = self._build_comprehensive_queries(certificate_title)
        return await self._run_categorized_queries(
            queries,
            delay_seconds=0.5,  # SearXNG은 로컬이므로 짧은 지연
            default_count=settings.BRAVE_SEARCH_RESULTS_PER_CATEGORY,
        )

    async def search_study_plan_context(
        self,
        certificate_title: str,
        *,
        delay_seconds: float = 0.5,
    ) -> dict[str, list[dict]]:
        """학습 계획 프롬프트 보강용 정보를 검색합니다.

        Args:
            certificate_title: 자격증 한글명.
            delay_seconds: 속도 제한을 위한 쿼리 간 지연 시간.

        Returns:
            학습 계획에 맞춘 카테고리별 검색 결과 딕셔너리.
        """
        settings = get_settings()
        queries = self._build_study_plan_queries(certificate_title)
        return await self._run_categorized_queries(
            queries,
            delay_seconds=delay_seconds,
            default_count=settings.BRAVE_SEARCH_RESULTS_PER_CATEGORY,
        )

    def _extract_results(
        self,
        api_response: dict,
        keyword_hints: Optional[list[str]] = None,
    ) -> list[dict]:
        """검색 결과를 추출해 구조화합니다.

        Args:
            api_response: Brave 호환 형식의 API 응답.
            keyword_hints: 관련성 점수 가중치를 위한 선택 키워드.

        Returns:
            품질 점수를 포함한 구조화된 결과 딕셔너리 목록.
        """
        web_results = api_response.get("web", {}).get("results", [])
        hints = keyword_hints or []

        extracted = []
        for result in web_results:
            url = result.get("url", "")

            # Calculate URL quality score
            url_score = self._calculate_url_quality(url)

            # Extract recency (newer is better)
            age = result.get("age", "")
            recency_score = self._calculate_recency_score(age)

            keyword_score = self._calculate_keyword_score(
                f"{result.get('title', '')} {result.get('description', '')}",
                hints,
            )

            extracted.append(
                {
                    "title": result.get("title", ""),
                    "url": url,
                    "description": result.get("description", ""),
                    "age": age,
                    "language": result.get("language", "ko"),
                    "url_quality": url_score,
                    "recency_score": recency_score,
                    "keyword_score": keyword_score,
                }
            )

        # Sort by combined score
        if hints:
            extracted.sort(
                key=lambda x: (
                    x["url_quality"] * 0.5
                    + x["recency_score"] * 0.3
                    + x["keyword_score"] * 0.2
                ),
                reverse=True,
            )
        else:
            extracted.sort(
                key=lambda x: x["url_quality"] * 0.6 + x["recency_score"] * 0.4,
                reverse=True,
            )

        return extracted

    def _calculate_url_quality(self, url: str) -> int:
        """출처 유형을 기준으로 URL 품질 점수를 계산합니다.

        Args:
            url: URL 문자열.

        Returns:
            품질 점수 0-100.
        """
        url_lower = url.lower()

        # Official government/certification sites (highest priority)
        if any(
            domain in url_lower
            for domain in [
                "q-net.or.kr",
                ".go.kr",
                "korcham.net",
                "hrdkorea.or.kr",
            ]
        ):
            return 100

        # Official education platforms (high priority)
        if any(
            domain in url_lower
            for domain in [
                "eduwill.net",
                "hackers.com",
                "sdedu.co.kr",
                "ekac.or.kr",
            ]
        ):
            return 90

        # News sites (medium-high priority)
        if any(
            domain in url_lower
            for domain in [
                "naver.com/news",
                "daum.net/news",
                "chosun.com",
                "joongang.co.kr",
                "hani.co.kr",
            ]
        ):
            return 75

        # Educational institutions (medium priority)
        if any(domain in url_lower for domain in [".ac.kr", ".edu"]):
            return 70

        # Community sites (lower priority, but useful for reviews)
        if any(
            domain in url_lower
            for domain in [
                "naver.com/cafe",
                "blog.naver.com",
                "tistory.com",
                "brunch.co.kr",
            ]
        ):
            return 50

        # Forum/Community (lowest priority)
        if any(
            domain in url_lower
            for domain in [
                "dcinside.com",
                "clien.net",
                "todayhumor.co.kr",
            ]
        ):
            return 40

        # Unknown sources
        return 60

    def _calculate_recency_score(self, age: str) -> int:
        """기간 문자열로 최신성 점수를 계산합니다.

        Args:
            age: "2 months ago" 같은 기간 문자열.

        Returns:
            최신성 점수 0-100.
        """
        if not age:
            return 50

        age_lower = age.lower()

        # Very recent
        if any(term in age_lower for term in ["hour", "시간", "minute", "분"]):
            return 100
        if any(term in age_lower for term in ["day", "일", "today", "오늘"]):
            return 95
        if "week" in age_lower or "주" in age_lower:
            return 85

        # Recent
        if "month" in age_lower or "개월" in age_lower or "달" in age_lower:
            try:
                months = int("".join(filter(str.isdigit, age_lower)))
                return max(40, 80 - (months * 10))
            except ValueError:
                return 60

        # Old
        if "year" in age_lower or "년" in age_lower:
            try:
                years = int("".join(filter(str.isdigit, age_lower)))
                return max(10, 50 - (years * 15))
            except ValueError:
                return 30

        return 50

    def _calculate_keyword_score(self, text: str, keywords: list[str]) -> int:
        """힌트 키워드 일치 기반으로 관련성 점수를 계산합니다.

        Args:
            text: 검색할 텍스트.
            keywords: 힌트 키워드 목록.

        Returns:
            관련성 점수 0-100.
        """
        if not text or not keywords:
            return 0

        text_lower = text.lower()
        hits = 0
        for keyword in keywords:
            keyword_lower = keyword.lower().strip()
            if keyword_lower and keyword_lower in text_lower:
                hits += 1

        if hits == 0:
            return 0

        return min(100, int(100 * hits / max(len(keywords), 1)))

    def format_search_results_for_llm(
        self,
        search_results: dict[str, list[dict]],
        categories: Optional[dict[str, str]] = None,
    ) -> str:
        """카테고리별 검색 결과를 LLM 입력 문자열로 포맷합니다.

        Args:
            search_results: 카테고리별 검색 결과 딕셔너리.
            categories: 선택 카테고리 표시 이름.

        Returns:
            모든 검색 결과를 담은 포맷 문자열.
        """
        output = "=== 자격증 정보 검색 결과 ===\n\n"

        categories = categories or {
            "general": "1. 시험 기본 정보",
            "statistics": "2. 합격률 및 준비기간 통계",
            "career": "3. 진로 및 활용",
            "reviews": "4. 합격 후기 및 팁",
            "study_methods": "5. 학습 방법 및 계획",
            "books": "6. 추천 교재",
            "lectures": "7. 추천 강의",
            "official": "8. 공식 출처",
        }

        for category_key, category_name in categories.items():
            results = search_results.get(category_key, [])

            output += f"## {category_name}\n\n"

            if not results:
                output += "  (검색 결과 없음)\n\n"
                continue

            for idx, result in enumerate(results, 1):
                output += f"[{category_key.upper()}-{idx}]\n"
                output += f"제목: {result['title']}\n"
                output += f"URL: {result['url']}\n"

                url_quality = result.get("url_quality", 0)
                if url_quality >= 90:
                    output += "출처: 공식 사이트 [***]\n"
                elif url_quality >= 70:
                    output += "출처: 신뢰할 수 있는 사이트 [**]\n"
                elif url_quality >= 50:
                    output += "출처: 참고용 [*]\n"

                output += f"내용: {result['description']}\n"

                if result.get("age"):
                    output += f"최근성: {result['age']}"
                    recency = result.get("recency_score", 0)
                    if recency >= 80:
                        output += " (최신 정보)\n"
                    elif recency < 40:
                        output += " (오래된 정보 주의)\n"
                    else:
                        output += "\n"

                output += "\n"

        output += "=== 검색 종료 ===\n"
        total_results = sum(len(results) for results in search_results.values())
        output += f"총 {total_results}개의 자료 수집됨"

        return output

    def _build_comprehensive_queries(self, certificate_title: str) -> dict[str, dict]:
        """자격증 보강용 확장 쿼리를 생성합니다.

        Args:
            certificate_title: 자격증 한글명.

        Returns:
            카테고리별 쿼리 딕셔너리.
        """
        return {
            "general": {
                "query": f"{certificate_title} 자격증 시험 과목 합격기준 응시료",
                "keywords": ["시험", "과목", "합격 기준", "응시료", "시험 시간"],
            },
            "statistics": {
                "query": f"{certificate_title} 자격증 합격률 공부기간 평균",
                "keywords": ["합격률", "응시자", "통계", "공부기간", "준비기간"],
            },
            "career": {
                "query": f"{certificate_title} 자격증 연봉 통계 취업 전망",
                "keywords": ["연봉", "취업", "전망", "직무", "커리어"],
            },
            "reviews": {
                "query": f"{certificate_title} 자격증 합격 후기 공부법 난이도 팁",
                "keywords": ["합격 후기", "공부법", "난이도", "팁", "경험담"],
            },
            "study_methods": {
                "query": f"{certificate_title} 자격증 공부 순서 학습 계획 단계별",
                "keywords": ["공부 순서", "학습 계획", "단계", "시간 배분", "교재"],
            },
            "books": {
                "query": f"{certificate_title} 자격증 추천 교재 교재명 출판사",
                "keywords": ["교재", "수험서", "추천", "출판사"],
            },
            "lectures": {
                "query": f"{certificate_title} 자격증 인강 추천 강의",
                "keywords": ["인강", "강의", "커리큘럼", "수강"],
            },
            "official": {
                "query": f"{certificate_title} 자격증 큐넷 한국산업인력공단",
                "keywords": ["공식", "큐넷", "한국산업인력공단", "공고"],
            },
        }

    def _build_study_plan_queries(self, certificate_title: str) -> dict[str, dict]:
        """학습 계획 관련 신호 수집 쿼리를 생성합니다.

        Args:
            certificate_title: 자격증 한글명.

        Returns:
            카테고리별 쿼리 딕셔너리.
        """
        return {
            "exam_schedule": {
                "query": f"{certificate_title} 시험 일정 접수 기간",
                "keywords": ["시험 일정", "접수 기간", "시행계획", "공고", "시험일"],
            },
            "exam_structure": {
                "query": f"{certificate_title} 과목 배점 문항 수 시험 시간",
                "keywords": ["과목", "배점", "문항", "시험 시간", "합격 기준"],
            },
            "pass_rate": {
                "query": f"{certificate_title} 합격률 응시자 수 통계",
                "keywords": ["합격률", "응시자", "통계", "추이"],
            },
            "study_period": {
                "query": f"{certificate_title} 준비기간 평균 공부기간",
                "keywords": ["준비기간", "공부기간", "평균", "개월"],
            },
            "study_plan_examples": {
                "query": f"{certificate_title} 합격 수기 공부 계획 주차별",
                "keywords": ["합격 수기", "공부 계획", "주차별", "시간표"],
            },
            "learning_sequence": {
                "query": f"{certificate_title} 공부 순서 학습 순서 커리큘럼",
                "keywords": ["공부 순서", "학습 순서", "커리큘럼", "단계"],
            },
            "time_allocation": {
                "query": f"{certificate_title} 이론 실전 복습 시간 배분",
                "keywords": ["이론", "실전", "복습", "시간 배분", "비율"],
            },
            "weak_subjects": {
                "query": f"{certificate_title} 과목별 난이도 취약 과목",
                "keywords": ["과목별", "난이도", "취약", "전략"],
            },
            "mock_exams": {
                "query": f"{certificate_title} 기출문제 모의고사 오답노트",
                "keywords": ["기출문제", "모의고사", "오답노트", "반복"],
            },
            "official": {
                "query": f"{certificate_title} 자격증 큐넷 한국산업인력공단",
                "keywords": ["공식", "큐넷", "한국산업인력공단", "공고"],
            },
        }

    async def _run_categorized_queries(
        self,
        queries: dict[str, dict],
        *,
        delay_seconds: float,
        default_count: int = 10,
    ) -> dict[str, list[dict]]:
        """선택 키워드 힌트를 적용해 카테고리별 쿼리를 실행합니다.

        Args:
            queries: 카테고리별 쿼리 딕셔너리.
            delay_seconds: 쿼리 간 지연 시간.
            default_count: 기본 결과 수.

        Returns:
            카테고리별 검색 결과 딕셔너리.
        """
        results = {}

        for category, payload in queries.items():
            query = payload["query"]
            query_count = payload.get("count", default_count)
            keywords = payload.get("keywords", [])

            try:
                logger.info(f"Searching {category}...")
                search_result = await self.search(query, count=query_count)
                results[category] = self._extract_results(
                    search_result,
                    keyword_hints=keywords,
                )
                logger.info(f"  {len(results[category])} results")
            except Exception as e:
                logger.error(f"Search error for {category}: {e}")
                results[category] = []

            if delay_seconds > 0:
                await asyncio.sleep(delay_seconds)

        return results


# Singleton instance
_searxng_service: Optional[SearXNGSearchService] = None


def get_searxng_service() -> SearXNGSearchService:
    """싱글턴 SearXNG Search 서비스 인스턴스를 반환합니다.

    Returns:
        SearXNGSearchService 인스턴스.
    """
    global _searxng_service
    if _searxng_service is None:
        _searxng_service = SearXNGSearchService()
    return _searxng_service
