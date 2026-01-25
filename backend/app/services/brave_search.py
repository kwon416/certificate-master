"""Brave Search API 통합 서비스.

이 모듈은 다중 쿼리 전략을 강화해 Brave Search API로 자격증 정보를
검색하는 기능을 제공합니다.
"""
import httpx
import asyncio
from typing import Optional

from app.core.config import get_settings


class BraveSearchService:
    """다중 쿼리를 지원하는 Brave Search API 통합 서비스."""

    def __init__(self, api_key: Optional[str] = None):
        """Brave Search 서비스를 초기화합니다.

        Args:
            api_key: Brave API 키. 제공되지 않으면 설정 값을 사용합니다.
        """
        settings = get_settings()
        self.api_key = api_key or settings.BRAVE_API_KEY
        self.base_url = "https://api.search.brave.com/res/v1/web/search"

    async def search(
        self,
        query: str,
        count: int = 5,
        country: str = "KR",
        search_lang: str = "ko",
    ) -> dict:
        """Brave API로 검색합니다.

        Args:
            query: 검색 질의 문자열.
            count: 반환할 결과 수(기본값: 5).
            country: 지역화 결과를 위한 국가 코드(기본값: KR).
            search_lang: 검색 언어(기본값: ko).

        Returns:
            검색 결과를 담은 딕셔너리.

        Raises:
            httpx.HTTPError: API 요청이 실패한 경우.
        """
        if not self.api_key:
            raise ValueError("BRAVE_API_KEY not configured")

        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.api_key,
        }

        params = {
            "q": query,
            "count": count,
            "country": country,
            "search_lang": search_lang,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.base_url,
                headers=headers,
                params=params,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    async def search_certificate_comprehensive(
        self, certificate_title: str
    ) -> dict[str, list[dict]]:
        """여러 쿼리로 자격증 정보를 종합 검색합니다.

        Args:
            certificate_title: 자격증 한글명.

        Returns:
            카테고리별 검색 결과 딕셔너리:
            - general: 시험 기본 정보
            - statistics: 합격률 추이 및 준비기간 분포
            - career: 진로 및 활용 정보
            - reviews: 합격 후기 및 팁
            - study_methods: 학습 방법 및 계획
            - books: 추천 교재
            - lectures: 추천 강의
            - official: 공식 출처

        Note:
            속도 제한을 피하기 위해 1.0초 지연을 두고 8개 쿼리를
            순차적으로 실행합니다(무료 티어: 초당 1회).
        """
        settings = get_settings()
        queries = self._build_comprehensive_queries(certificate_title)
        return await self._run_categorized_queries(
            queries,
            delay_seconds=1.0,
            default_count=settings.BRAVE_SEARCH_RESULTS_PER_CATEGORY,
        )

    async def search_study_plan_context(
        self,
        certificate_title: str,
        *,
        delay_seconds: float = 1.0,
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
            api_response: Brave의 원본 API 응답.
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
                    "url_quality": url_score,  # 0-100
                    "recency_score": recency_score,  # 0-100
                    "keyword_score": keyword_score,  # 0-100
                }
            )

        # Sort by combined score (url_quality + recency + keyword relevance)
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
            url: URL 문자열

        Returns:
            품질 점수 0-100
        """
        url_lower = url.lower()
        
        # Official government/certification sites (highest priority)
        if any(domain in url_lower for domain in [
            "q-net.or.kr",  # 큐넷
            ".go.kr",  # 정부 사이트
            "korcham.net",  # 대한상공회의소
            "hrdkorea.or.kr",  # 한국산업인력공단
        ]):
            return 100
        
        # Official education platforms (high priority)
        if any(domain in url_lower for domain in [
            "eduwill.net",  # 에듀윌
            "hackers.com",  # 해커스
            "sdedu.co.kr",  # 시대에듀
            "ekac.or.kr",  # 한국회계평가원
        ]):
            return 90
        
        # News sites (medium-high priority)
        if any(domain in url_lower for domain in [
            "naver.com/news",
            "daum.net/news",
            "chosun.com",
            "joongang.co.kr",
            "hani.co.kr",
        ]):
            return 75
        
        # Educational institutions (medium priority)
        if any(domain in url_lower for domain in [
            ".ac.kr",  # 대학
            ".edu",
        ]):
            return 70
        
        # Community sites (lower priority, but useful for reviews)
        if any(domain in url_lower for domain in [
            "naver.com/cafe",
            "blog.naver.com",
            "tistory.com",
            "brunch.co.kr",
        ]):
            return 50
        
        # Forum/Community (lowest priority)
        if any(domain in url_lower for domain in [
            "dcinside.com",
            "clien.net",
            "todayhumor.co.kr",
        ]):
            return 40
        
        # Unknown sources
        return 60
    
    def _calculate_recency_score(self, age: str) -> int:
        """기간 문자열로 최신성 점수를 계산합니다.

        Args:
            age: "2 months ago", "1 year ago" 같은 기간 문자열

        Returns:
            최신성 점수 0-100 (100 = 가장 최신)
        """
        if not age:
            return 50  # Unknown, assume medium
        
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
            # Try to extract number
            try:
                months = int(''.join(filter(str.isdigit, age_lower)))
                return max(40, 80 - (months * 10))  # 1 month=70, 2=60, 3=50...
            except:
                return 60
        
        # Old
        if "year" in age_lower or "년" in age_lower:
            try:
                years = int(''.join(filter(str.isdigit, age_lower)))
                return max(10, 50 - (years * 15))  # 1 year=35, 2=20, 3=5...
            except:
                return 30
        
        return 50

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
                
                # Add quality indicators
                url_quality = result.get('url_quality', 0)
                if url_quality >= 90:
                    output += f"출처: 공식 사이트 [***]\n"
                elif url_quality >= 70:
                    output += f"출처: 신뢰할 수 있는 사이트 [**]\n"
                elif url_quality >= 50:
                    output += f"출처: 참고용 [*]\n"
                
                output += f"내용: {result['description']}\n"
                
                if result.get("age"):
                    output += f"최근성: {result['age']}"
                    recency = result.get('recency_score', 0)
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
        """자격증 보강용 확장 쿼리를 생성합니다."""
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
                "query": f"{certificate_title} 자격증 합격 후기 공부법 난이도 팁 경험담 몇개월 공부 준비기간",
                "keywords": ["합격 후기", "공부법", "난이도", "팁", "경험담"],
            },
            "study_methods": {
                "query": f"{certificate_title} 자격증 공부 순서 학습 계획 단계별 공부 방법 교재 추천 시간 배분",
                "keywords": ["공부 순서", "학습 계획", "단계", "시간 배분", "교재"],
            },
            "books": {
                "query": f"{certificate_title} 자격증 추천 교재 교재명 출판사 수험서",
                "keywords": ["교재", "수험서", "추천", "출판사"],
            },
            "lectures": {
                "query": f"{certificate_title} 자격증 인강 추천 강의 에듀윌 해커스 시대에듀",
                "keywords": ["인강", "강의", "커리큘럼", "수강"],
            },
            "official": {
                "query": f"{certificate_title} 자격증 큐넷 한국산업인력공단",
                "keywords": ["공식", "큐넷", "한국산업인력공단", "공고"],
            },
        }

    def _build_study_plan_queries(self, certificate_title: str) -> dict[str, dict]:
        """학습 계획 관련 신호 수집 쿼리를 생성합니다."""
        return {
            "exam_schedule": {
                "query": f"{certificate_title} 시험 일정 접수 기간 시행계획 공고",
                "keywords": ["시험 일정", "접수 기간", "시행계획", "공고", "시험일"],
            },
            "exam_structure": {
                "query": f"{certificate_title} 과목 배점 문항 수 시험 시간 합격 기준",
                "keywords": ["과목", "배점", "문항", "시험 시간", "합격 기준"],
            },
            "pass_rate": {
                "query": f"{certificate_title} 합격률 응시자 수 통계 최근",
                "keywords": ["합격률", "응시자", "통계", "추이"],
            },
            "study_period": {
                "query": f"{certificate_title} 준비기간 평균 공부기간 몇개월",
                "keywords": ["준비기간", "공부기간", "평균", "개월"],
            },
            "study_plan_examples": {
                "query": f"{certificate_title} 합격 수기 공부 계획 주차별 학습 계획 시간표",
                "keywords": ["합격 수기", "공부 계획", "주차별", "시간표"],
            },
            "learning_sequence": {
                "query": f"{certificate_title} 공부 순서 학습 순서 커리큘럼 단계별",
                "keywords": ["공부 순서", "학습 순서", "커리큘럼", "단계"],
            },
            "time_allocation": {
                "query": f"{certificate_title} 이론 실전 복습 시간 배분 비율",
                "keywords": ["이론", "실전", "복습", "시간 배분", "비율"],
            },
            "weak_subjects": {
                "query": f"{certificate_title} 과목별 난이도 취약 과목 고득점 전략",
                "keywords": ["과목별", "난이도", "취약", "전략"],
            },
            "mock_exams": {
                "query": f"{certificate_title} 기출문제 모의고사 오답노트 반복 학습",
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
        """선택 키워드 힌트를 적용해 카테고리별 쿼리를 실행합니다."""
        results = {}

        for category, payload in queries.items():
            query = payload["query"]
            query_count = payload.get("count", default_count)
            keywords = payload.get("keywords", [])

            try:
                print(f"  Searching {category}...", end=" ")
                search_result = await self.search(query, count=query_count)
                results[category] = self._extract_results(
                    search_result,
                    keyword_hints=keywords,
                )
                print(f"{len(results[category])} results")
            except Exception as e:
                print(f"Error: {e}")
                results[category] = []

            if delay_seconds > 0:
                await asyncio.sleep(delay_seconds)

        return results

    def _calculate_keyword_score(self, text: str, keywords: list[str]) -> int:
        """힌트 키워드 일치 기반으로 관련성 점수를 계산합니다."""
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



# Singleton instance
_brave_service: Optional[BraveSearchService] = None


def get_brave_service() -> BraveSearchService:
    """싱글턴 Brave Search 서비스 인스턴스를 반환합니다.

    Returns:
        BraveSearchService 인스턴스.
    """
    global _brave_service
    if _brave_service is None:
        _brave_service = BraveSearchService()
    return _brave_service
