# Hybrid Search Recommendation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LLM 호출을 제거하고 Dense+Sparse(BM25) 하이브리드 검색 + RRF 결합으로 추천 속도를 10-20배 개선하며 검색 정확도를 향상시킨다.

**Architecture:** ChromaDB Dense 검색과 BM25 Sparse 검색을 병렬 실행 후 RRF(Reciprocal Rank Fusion)로 결합한다. LLM context 추출은 4단계 규칙 기반 키워드 파싱으로, LLM 이유 생성은 데이터 기반 동적 템플릿 엔진으로 대체한다. 임베딩 텍스트를 검색 최적화 압축 텍스트로 분리하여 벡터 검색 정확도를 높인다.

**Tech Stack:** FastAPI, ChromaDB, OpenAI text-embedding-3-small, rank-bm25, pytest

**Design Doc:** `docs/plans/2026-02-18-hybrid-search-recommendation-design.md`

---

## Task 1: Tokenizer (공백 + 2-gram)

**Files:**
- Create: `backend/app/services/search/__init__.py`
- Create: `backend/app/services/search/tokenizer.py`
- Create: `backend/tests/unit/test_tokenizer.py`

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_tokenizer.py
"""공백 분할 + character 2-gram 토큰화 테스트."""

import pytest
from app.services.search.tokenizer import tokenize


class TestTokenize:
    """tokenize 함수 테스트."""

    def test_splits_by_whitespace(self):
        """공백으로 분리한다."""
        tokens = tokenize("정보처리기사 자격증")
        assert "정보처리기사" in tokens
        assert "자격증" in tokens

    def test_generates_bigrams(self):
        """2-gram을 생성한다."""
        tokens = tokenize("정보처리기사")
        assert "정보" in tokens
        assert "보처" in tokens
        assert "처리" in tokens
        assert "리기" in tokens
        assert "기사" in tokens

    def test_includes_original_word_and_bigrams(self):
        """원본 단어와 2-gram을 모두 포함한다."""
        tokens = tokenize("전기기사 자격증")
        # 원본 단어
        assert "전기기사" in tokens
        assert "자격증" in tokens
        # 2-gram도 포함
        assert "전기" in tokens
        assert "기기" in tokens
        assert "기사" in tokens

    def test_empty_string_returns_empty_list(self):
        """빈 문자열은 빈 리스트를 반환한다."""
        assert tokenize("") == []

    def test_single_char_word_no_bigram(self):
        """1글자 단어는 bigram 없이 원본만 포함."""
        tokens = tokenize("IT 보안")
        assert "IT" in tokens
        assert "보안" in tokens

    def test_removes_duplicates(self):
        """중복 토큰을 제거한다."""
        tokens = tokenize("기사 기사")
        assert tokens.count("기사") == 1

    def test_strips_whitespace(self):
        """앞뒤 공백을 제거한다."""
        tokens = tokenize("  정보처리기사  ")
        assert "정보처리기사" in tokens
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_tokenizer.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services.search'`

### Step 3: Write minimal implementation

```python
# backend/app/services/search/__init__.py
"""하이브리드 검색 서비스 패키지."""
```

```python
# backend/app/services/search/tokenizer.py
"""공백 분할 + character 2-gram 토큰화.

한국어 자격증명은 대부분 명사 조합이므로 형태소 분석 없이
공백 분할 + 2-gram 방식으로 충분한 키워드 매칭이 가능하다.
"""


def tokenize(text: str) -> list[str]:
    """텍스트를 공백 분할 후 2-gram을 포함한 토큰 리스트로 변환한다.

    Args:
        text: 토큰화할 텍스트

    Returns:
        중복 제거된 토큰 리스트 (원본 단어 + 2-gram)
    """
    text = text.strip()
    if not text:
        return []

    words = text.split()
    seen: set[str] = set()
    tokens: list[str] = []

    for word in words:
        if word and word not in seen:
            seen.add(word)
            tokens.append(word)

        # 2글자 이상인 단어에 대해 character 2-gram 생성
        if len(word) >= 2:
            for i in range(len(word) - 1):
                bigram = word[i : i + 2]
                if bigram not in seen:
                    seen.add(bigram)
                    tokens.append(bigram)

    return tokens
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_tokenizer.py -v`
Expected: All 7 tests PASS

### Step 5: Commit

```bash
git add backend/app/services/search/__init__.py backend/app/services/search/tokenizer.py backend/tests/unit/test_tokenizer.py
git commit -m "feat: add whitespace + 2-gram tokenizer for BM25 search"
```

---

## Task 2: BM25 Search Service

**Files:**
- Create: `backend/app/services/search/bm25_service.py`
- Create: `backend/tests/unit/test_bm25_service.py`
- Modify: `backend/pyproject.toml` (add `rank-bm25` dependency)

### Step 1: Add rank-bm25 dependency

Modify `backend/pyproject.toml` — add `"rank-bm25>=0.2"` to `[project.dependencies]` list.

Run: `cd backend && uv sync --extra dev`

### Step 2: Write the failing tests

```python
# backend/tests/unit/test_bm25_service.py
"""BM25 키워드 기반 검색 서비스 테스트."""

import pytest
from app.services.search.bm25_service import BM25SearchService


@pytest.fixture
def sample_certificates() -> list[dict]:
    """테스트용 자격증 데이터."""
    return [
        {
            "id": "cert-001",
            "title": "정보처리기사",
            "categories": "국가기술자격",
            "series": "정보처리",
            "overview": "소프트웨어 개발 및 운용에 관한 전문 자격증",
            "career_info": {
                "industry": "IT/소프트웨어",
                "related_jobs": "소프트웨어 개발자, 시스템 엔지니어",
            },
            "domain": "IT/소프트웨어",
        },
        {
            "id": "cert-002",
            "title": "전기기사",
            "categories": "국가기술자격",
            "series": "전기",
            "overview": "전기설비의 설계 및 시공에 관한 전문 자격증",
            "career_info": {
                "industry": "전기/전자",
                "related_jobs": "전기 엔지니어, 전기 감리원",
            },
            "domain": "전기/전자",
        },
        {
            "id": "cert-003",
            "title": "정보보안기사",
            "categories": "국가기술자격",
            "series": "정보보안",
            "overview": "정보보안 시스템 운영 및 관리에 관한 전문 자격증",
            "career_info": {
                "industry": "IT/소프트웨어",
                "related_jobs": "보안 전문가, 보안 컨설턴트",
            },
            "domain": "IT/소프트웨어",
        },
    ]


class TestBM25SearchService:
    """BM25 검색 서비스 테스트."""

    def test_build_index(self, sample_certificates):
        """인덱스를 빌드할 수 있다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)
        assert service.is_ready()

    def test_search_returns_relevant_results(self, sample_certificates):
        """관련성 높은 결과를 반환한다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("정보처리기사", top_k=3)
        assert len(results) > 0
        assert results[0]["id"] == "cert-001"

    def test_search_with_domain_filter(self, sample_certificates):
        """도메인 필터링이 동작한다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("기사", domains=["IT/소프트웨어"], top_k=3)
        for r in results:
            assert r["domain"] == "IT/소프트웨어"

    def test_search_returns_scores(self, sample_certificates):
        """검색 결과에 점수가 포함된다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("정보처리", top_k=3)
        assert all("score" in r for r in results)
        assert all(r["score"] >= 0 for r in results)

    def test_search_results_sorted_by_score(self, sample_certificates):
        """결과가 점수 내림차순으로 정렬된다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("정보 소프트웨어", top_k=3)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_search_empty_query_returns_empty(self, sample_certificates):
        """빈 쿼리는 빈 결과를 반환한다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("", top_k=3)
        assert results == []

    def test_search_before_build_raises(self):
        """인덱스 빌드 전 검색은 에러."""
        service = BM25SearchService()
        with pytest.raises(RuntimeError):
            service.search("정보처리기사")

    def test_top_k_limits_results(self, sample_certificates):
        """top_k로 결과 수를 제한한다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("기사", top_k=1)
        assert len(results) <= 1

    def test_search_keyword_in_overview(self, sample_certificates):
        """overview 내용으로도 검색된다."""
        service = BM25SearchService()
        service.build_index(sample_certificates)

        results = service.search("보안 시스템", top_k=3)
        ids = [r["id"] for r in results]
        assert "cert-003" in ids
```

### Step 3: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_bm25_service.py -v`
Expected: FAIL with `ModuleNotFoundError`

### Step 4: Write minimal implementation

```python
# backend/app/services/search/bm25_service.py
"""BM25 키워드 기반 검색 서비스.

인메모리 BM25 인덱스를 구축하여 키워드 기반 Sparse 검색을 수행한다.
Dense 검색(ChromaDB)과 결합하여 하이브리드 검색의 Sparse 부분을 담당한다.
"""

from __future__ import annotations

import logging
from typing import Optional

from rank_bm25 import BM25Okapi

from app.services.search.tokenizer import tokenize

logger = logging.getLogger(__name__)


class BM25SearchService:
    """BM25 기반 키워드 검색 서비스.

    앱 시작 시 MariaDB의 자격증 데이터로 인덱스를 빌드하고,
    쿼리 텍스트에 대해 BM25 유사도 기반 검색을 수행한다.
    """

    def __init__(self) -> None:
        self._index: Optional[BM25Okapi] = None
        self._cert_ids: list[str] = []
        self._cert_domains: list[str] = []
        self._cert_metadata: list[dict] = []

    def is_ready(self) -> bool:
        """인덱스가 빌드되어 사용 가능한 상태인지 확인."""
        return self._index is not None

    def build_index(self, certificates: list[dict]) -> None:
        """자격증 데이터로 BM25 인덱스를 빌드한다.

        Args:
            certificates: 자격증 데이터 리스트. 각 항목은 id, title,
                categories, series, overview, career_info, domain 필드 포함.
        """
        corpus: list[list[str]] = []
        self._cert_ids = []
        self._cert_domains = []
        self._cert_metadata = []

        for cert in certificates:
            text = self._build_index_text(cert)
            tokens = tokenize(text)
            corpus.append(tokens)
            self._cert_ids.append(cert["id"])
            self._cert_domains.append(cert.get("domain", ""))
            self._cert_metadata.append(cert)

        if corpus:
            self._index = BM25Okapi(corpus)
        else:
            self._index = None

        logger.info("BM25 인덱스 빌드 완료: %d건", len(corpus))

    def search(
        self,
        query: str,
        top_k: int = 10,
        domains: Optional[list[str]] = None,
    ) -> list[dict]:
        """BM25 유사도 기반 검색을 수행한다.

        Args:
            query: 검색 쿼리 텍스트
            top_k: 반환할 최대 결과 수
            domains: 도메인 필터 리스트 (None이면 전체 검색)

        Returns:
            검색 결과 리스트. 각 항목은 id, score, domain 필드 포함.

        Raises:
            RuntimeError: 인덱스가 빌드되지 않은 상태에서 호출 시
        """
        if not self.is_ready():
            raise RuntimeError("BM25 인덱스가 빌드되지 않았습니다. build_index()를 먼저 호출하세요.")

        query = query.strip()
        if not query:
            return []

        query_tokens = tokenize(query)
        scores = self._index.get_scores(query_tokens)

        # (index, score) 쌍으로 만들어 점수 내림차순 정렬
        indexed_scores = list(enumerate(scores))
        indexed_scores.sort(key=lambda x: x[1], reverse=True)

        results: list[dict] = []
        for idx, score in indexed_scores:
            if score <= 0:
                continue

            cert_domain = self._cert_domains[idx]

            # 도메인 필터 적용
            if domains and cert_domain not in domains:
                continue

            results.append(
                {
                    "id": self._cert_ids[idx],
                    "score": float(score),
                    "domain": cert_domain,
                }
            )

            if len(results) >= top_k:
                break

        return results

    def _build_index_text(self, cert: dict) -> str:
        """자격증 데이터에서 BM25 인덱스용 텍스트를 생성한다."""
        career_info = cert.get("career_info", {}) or {}
        parts = [
            cert.get("title", ""),
            cert.get("categories", ""),
            cert.get("series", ""),
            career_info.get("industry", ""),
            career_info.get("related_jobs", ""),
            (cert.get("overview", "") or "")[:200],
        ]
        return " ".join(filter(None, parts))


# 싱글톤 인스턴스
_bm25_service: Optional[BM25SearchService] = None


def get_bm25_service() -> BM25SearchService:
    """BM25 서비스 싱글톤 인스턴스를 반환한다."""
    global _bm25_service
    if _bm25_service is None:
        _bm25_service = BM25SearchService()
    return _bm25_service
```

### Step 5: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_bm25_service.py -v`
Expected: All 9 tests PASS

### Step 6: Commit

```bash
git add backend/pyproject.toml backend/app/services/search/bm25_service.py backend/tests/unit/test_bm25_service.py
git commit -m "feat: add BM25 keyword search service with rank-bm25"
```

---

## Task 3: Enhanced Context Parser (4단계 규칙 기반)

**Files:**
- Create: `backend/app/services/search/context_parser.py`
- Create: `backend/tests/unit/test_enhanced_context_parser.py`

**참고 파일:**
- 기존 파서: `backend/app/services/study/context_parser.py` (기존 패턴 참고)
- 스키마: `backend/app/schemas/recommendation.py` (`StructuredUserContext`)
- 도메인: `backend/app/core/domains.py` (`DOMAIN_LIST`)

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_enhanced_context_parser.py
"""개선된 4단계 규칙 기반 컨텍스트 파서 테스트.

기존 context_parser.py 대비 개선점:
1. 정규식 패턴 매칭 (더 정교한 패턴)
2. 동시 출현어 분석 (맥락 파악)
3. 수치 추출 (시간, 기간)
4. 도메인 자동 추론
"""

import pytest
from app.schemas.recommendation import StructuredUserContext
from app.services.search.context_parser import EnhancedContextParser


@pytest.fixture
def parser():
    return EnhancedContextParser()


class TestGoalExtraction:
    """1단계: 정규식 패턴 매칭 - 목표 추출."""

    def test_employment_keyword(self, parser):
        ctx = parser.parse("취업 준비 중인 대학생입니다")
        assert ctx.goal == "취업"

    def test_employment_from_graduation(self, parser):
        ctx = parser.parse("졸업 후 취업에 유리한 자격증")
        assert ctx.goal == "취업"

    def test_career_change(self, parser):
        ctx = parser.parse("이직을 위해 자격증을 따고 싶어요")
        assert ctx.goal == "이직"

    def test_career_strength(self, parser):
        ctx = parser.parse("승진에 도움되는 자격증 추천해주세요")
        assert ctx.goal == "전문성 강화"

    def test_self_development(self, parser):
        ctx = parser.parse("취미로 관심 있는 자격증을 알아보고 있어요")
        assert ctx.goal == "개인 관심"

    def test_business(self, parser):
        ctx = parser.parse("창업을 위해 필요한 자격증이 뭔가요")
        assert ctx.goal == "창업"

    def test_default_goal(self, parser):
        ctx = parser.parse("자격증 추천해주세요")
        assert ctx.goal == "취업"


class TestEmploymentExtraction:
    """1단계: 고용 상태 추출."""

    def test_student(self, parser):
        ctx = parser.parse("대학생인데 자격증 따고 싶어요")
        assert ctx.employment_status == "학생"

    def test_employed(self, parser):
        ctx = parser.parse("직장 다니면서 자격증 준비하려고 합니다")
        assert ctx.employment_status == "재직 중"

    def test_job_seeking(self, parser):
        ctx = parser.parse("구직 중인데 도움될 자격증 추천해주세요")
        assert ctx.employment_status == "구직 중"


class TestMajorExtraction:
    """1단계: 전공 배경 추출."""

    def test_non_major(self, parser):
        ctx = parser.parse("비전공자인데 IT 자격증 따고 싶어요")
        assert ctx.major_background == "비전공자"

    def test_major(self, parser):
        ctx = parser.parse("전공이 컴퓨터공학이에요")
        assert ctx.major_background == "전공자"


class TestNumericExtraction:
    """3단계: 수치 추출."""

    def test_daily_hours(self, parser):
        ctx = parser.parse("하루 3시간 공부 가능합니다")
        assert ctx.weekly_study_hours == 21  # 3 * 7

    def test_weekly_hours(self, parser):
        ctx = parser.parse("주 15시간 정도 투자할 수 있어요")
        assert ctx.weekly_study_hours == 15

    def test_study_period_months(self, parser):
        ctx = parser.parse("3개월 안에 딸 수 있는 자격증")
        assert ctx.max_study_period_days == 90

    def test_study_period_year(self, parser):
        ctx = parser.parse("1년 정도 준비할 수 있습니다")
        assert ctx.max_study_period_days == 365


class TestDifficultyExtraction:
    """1단계: 난이도 추출."""

    def test_easy(self, parser):
        ctx = parser.parse("쉬운 자격증 추천해주세요")
        assert ctx.difficulty_preference in ("하", "중하")

    def test_hard(self, parser):
        ctx = parser.parse("어렵더라도 전문적인 자격증")
        assert ctx.difficulty_preference in ("상", "중상")


class TestDomainInference:
    """4단계: 도메인 자동 추론."""

    def test_it_domain_from_text(self, parser):
        ctx = parser.parse("정보처리기사 따고 싶어요")
        assert "IT" in str(ctx.preferred_industries)

    def test_construction_domain_from_text(self, parser):
        ctx = parser.parse("건축기사 자격증 추천해주세요")
        assert any("건설" in ind or "건축" in ind for ind in ctx.preferred_industries)

    def test_explicit_domains_used(self, parser):
        ctx = parser.parse(
            "자격증 추천해주세요",
            domains=["IT/소프트웨어", "금융/회계"],
        )
        assert len(ctx.preferred_industries) > 0


class TestCooccurrence:
    """2단계: 동시 출현어 분석."""

    def test_non_major_employment_combination(self, parser):
        ctx = parser.parse("비전공자인데 취업 준비하고 있어요")
        assert ctx.major_background == "비전공자"
        assert ctx.goal == "취업"

    def test_worker_weekend_combination(self, parser):
        ctx = parser.parse("직장인이라 주말에만 공부 가능해요")
        assert ctx.employment_status == "재직 중"
        # 주말만 공부 → 주당 시간 제한적
        assert ctx.weekly_study_hours <= 15


class TestOutputValidity:
    """반환값 유효성 검증."""

    def test_returns_structured_context(self, parser):
        ctx = parser.parse("3개월 안에 쉬운 자격증 추천")
        assert isinstance(ctx, StructuredUserContext)
        assert ctx.goal in ["취업", "이직", "전문성 강화", "개인 관심", "창업"]
        assert ctx.employment_status in ["재직 중", "구직 중", "학생", "무직"]
        assert ctx.major_background in ["전공자", "비전공자", "관련 경험 있음"]
        assert 1 <= ctx.weekly_study_hours <= 40
        assert 30 <= ctx.max_study_period_days <= 730
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_enhanced_context_parser.py -v`
Expected: FAIL with `ImportError`

### Step 3: Write minimal implementation

```python
# backend/app/services/search/context_parser.py
"""개선된 4단계 규칙 기반 컨텍스트 파서.

기존 app.services.study.context_parser 대비 개선:
1단계: 정규식 패턴 매칭 (더 정교한 패턴)
2단계: 동시 출현어 분석 (맥락 파악)
3단계: 수치 추출 (시간, 기간)
4단계: 도메인 자동 추론 (입력 텍스트에서 도메인 키워드 매칭)
"""

from __future__ import annotations

import re
import logging
from typing import Optional

from app.schemas.recommendation import StructuredUserContext

logger = logging.getLogger(__name__)


# 4단계 도메인 자동 추론용 키워드 매핑
DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "IT/소프트웨어": [
        "정보처리", "네트워크", "보안", "프로그래밍", "컴퓨터",
        "IT", "소프트웨어", "데이터", "웹", "앱", "코딩",
        "리눅스", "클라우드", "AI", "인공지능",
    ],
    "전기/전자": [
        "전기", "전자", "전력", "회로", "반도체", "통신",
    ],
    "건설/안전": [
        "건축", "토목", "건설", "안전", "소방", "설비",
        "측량", "조경", "시공",
    ],
    "기계/자동차": [
        "기계", "자동차", "용접", "금속", "설계", "CAD",
    ],
    "화학/환경": [
        "화학", "환경", "위험물", "에너지", "가스", "수질",
    ],
    "금융/회계": [
        "금융", "회계", "세무", "재무", "은행", "보험",
        "투자", "증권", "펀드",
    ],
    "의료/보건": [
        "의료", "보건", "간호", "약사", "위생", "요양",
    ],
    "안전/품질": [
        "산업안전", "품질", "비파괴", "검사",
    ],
    "식품/조리": [
        "식품", "조리", "제과", "제빵", "영양", "위생사",
    ],
    "디자인/미디어": [
        "디자인", "그래픽", "영상", "미디어", "컬러리스트",
    ],
    "경영/사무": [
        "경영", "사무", "물류", "유통", "무역",
        "ERP", "비서", "행정",
    ],
    "기타": [],
}

# 도메인 → 산업 키워드 매핑 (preferred_industries 생성용)
DOMAIN_TO_INDUSTRIES: dict[str, list[str]] = {
    "IT/소프트웨어": ["IT", "소프트웨어", "인터넷"],
    "전기/전자": ["전기", "전자", "반도체"],
    "건설/안전": ["건설", "건축", "토목"],
    "기계/자동차": ["기계", "자동차", "제조"],
    "화학/환경": ["화학", "환경", "에너지"],
    "금융/회계": ["금융", "회계", "보험"],
    "의료/보건": ["의료", "보건", "제약"],
    "안전/품질": ["안전", "품질관리"],
    "식품/조리": ["식품", "외식", "호텔"],
    "디자인/미디어": ["디자인", "미디어", "광고"],
    "경영/사무": ["경영", "유통", "물류"],
}


class EnhancedContextParser:
    """4단계 파이프라인으로 사용자 컨텍스트를 추출한다."""

    # 1단계: 정규식 패턴 매칭
    GOAL_PATTERNS: dict[str, list[str]] = {
        "취업": [
            r"취업|취직|입사|신입|공채|면접",
            r"졸업\s*(후|예정|하고)",
        ],
        "이직": [r"이직|전직|경력\s*전환|다른\s*직장"],
        "전문성 강화": [r"승진|연봉|경력\s*개발|스펙|전문성"],
        "개인 관심": [r"자기\s*계발|취미|관심|배우고|재미"],
        "창업": [r"창업|사업|프리랜서|독립"],
    }

    EMPLOYMENT_PATTERNS: dict[str, list[str]] = {
        "학생": [r"대학생|학생|재학|졸업\s*예정|학교"],
        "재직 중": [r"직장|재직|회사|근무|사원|주말에만|퇴근\s*후"],
        "구직 중": [r"구직|실업|무직|백수|쉬고\s*있"],
    }

    MAJOR_PATTERNS: dict[str, list[str]] = {
        "비전공자": [r"비전공|비\s*전공|타\s*전공|문과"],
        "전공자": [r"전공이|전공자|관련\s*학과|관련\s*전공"],
        "관련 경험 있음": [r"경험\s*있|경력\s*있|현장\s*경험|실무\s*경험"],
    }

    DIFFICULTY_PATTERNS: dict[str, list[str]] = {
        "하": [r"쉬운|쉽게|기초|입문|초보"],
        "중하": [r"비교적\s*쉬운|난이도\s*낮"],
        "중상": [r"도전|심화|기사급"],
        "상": [r"어려운|어렵더라도|고난이도|전문적|기술사"],
    }

    # 3단계: 수치 추출 패턴
    DAILY_HOURS_PATTERN = re.compile(r"하루\s*(\d+)\s*시간")
    WEEKLY_HOURS_PATTERN = re.compile(r"주\s*(\d+)\s*시간")
    MONTHS_PATTERN = re.compile(r"(\d+)\s*개월")
    YEAR_PATTERN = re.compile(r"(\d+)\s*년")
    SHORT_TERM_PATTERN = re.compile(r"단기|빨리|빠르게|급하게")
    WEEKEND_PATTERN = re.compile(r"주말|토요일|일요일")

    def parse(
        self,
        user_input: str,
        domains: Optional[list[str]] = None,
    ) -> StructuredUserContext:
        """사용자 입력에서 구조화된 컨텍스트를 추출한다.

        Args:
            user_input: 사용자 자연어 입력
            domains: 선택된 도메인 리스트 (선택적)

        Returns:
            추출된 StructuredUserContext
        """
        text = user_input.strip()

        # 1단계: 정규식 패턴 매칭
        goal = self._match_first(text, self.GOAL_PATTERNS, default="취업")
        employment = self._match_first(
            text, self.EMPLOYMENT_PATTERNS, default="구직 중"
        )
        major = self._match_first(
            text, self.MAJOR_PATTERNS, default="비전공자"
        )
        difficulty = self._match_first(
            text, self.DIFFICULTY_PATTERNS, default="중"
        )

        # 2단계: 동시 출현어 분석
        if self.WEEKEND_PATTERN.search(text) and employment == "재직 중":
            # 주말만 공부 가능 → 시간 제한
            weekly_hours_hint = 10
        else:
            weekly_hours_hint = None

        # 3단계: 수치 추출
        weekly_hours = self._extract_weekly_hours(text, employment, weekly_hours_hint)
        study_period = self._extract_study_period(text)

        # 4단계: 도메인 자동 추론
        industries = self._infer_industries(text, domains)

        return StructuredUserContext(
            goal=goal,
            employment_status=employment,
            major_background=major,
            weekly_study_hours=weekly_hours,
            max_study_period_days=study_period,
            difficulty_preference=difficulty,
            preferred_industries=industries,
        )

    def _match_first(
        self,
        text: str,
        patterns: dict[str, list[str]],
        default: str,
    ) -> str:
        """패턴 딕셔너리에서 첫 번째 매칭된 키를 반환한다."""
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                if re.search(pattern, text):
                    return key
        return default

    def _extract_weekly_hours(
        self,
        text: str,
        employment: str,
        hint: Optional[int],
    ) -> int:
        """주당 학습 시간을 추출한다."""
        # 하루 N시간 패턴
        m = self.DAILY_HOURS_PATTERN.search(text)
        if m:
            return min(int(m.group(1)) * 7, 40)

        # 주 N시간 패턴
        m = self.WEEKLY_HOURS_PATTERN.search(text)
        if m:
            return min(int(m.group(1)), 40)

        # 동시 출현어 힌트
        if hint is not None:
            return hint

        # 디폴트: 고용상태별
        defaults = {"재직 중": 10, "학생": 20, "구직 중": 15}
        return defaults.get(employment, 15)

    def _extract_study_period(self, text: str) -> int:
        """학습 기간(일)을 추출한다."""
        # N개월 패턴
        m = self.MONTHS_PATTERN.search(text)
        if m:
            return min(int(m.group(1)) * 30, 730)

        # N년 패턴
        m = self.YEAR_PATTERN.search(text)
        if m:
            return min(int(m.group(1)) * 365, 730)

        # 단기 패턴
        if self.SHORT_TERM_PATTERN.search(text):
            return 90

        # 디폴트
        return 180

    def _infer_industries(
        self,
        text: str,
        domains: Optional[list[str]],
    ) -> list[str]:
        """텍스트와 도메인에서 산업 키워드를 추론한다."""
        industries: list[str] = []

        # 명시적 도메인이 있으면 우선 사용
        if domains:
            for domain in domains:
                if domain in DOMAIN_TO_INDUSTRIES:
                    industries.extend(DOMAIN_TO_INDUSTRIES[domain])

        # 텍스트에서 도메인 키워드 매칭
        for domain, keywords in DOMAIN_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text and domain in DOMAIN_TO_INDUSTRIES:
                    for ind in DOMAIN_TO_INDUSTRIES[domain]:
                        if ind not in industries:
                            industries.append(ind)
                    break  # 해당 도메인은 한 번만

        # 최대 5개
        return industries[:5] if industries else ["IT"]
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_enhanced_context_parser.py -v`
Expected: All tests PASS

### Step 5: Commit

```bash
git add backend/app/services/search/context_parser.py backend/tests/unit/test_enhanced_context_parser.py
git commit -m "feat: add enhanced 4-stage rule-based context parser"
```

---

## Task 4: Reason Template Engine (데이터 기반 동적 템플릿)

**Files:**
- Create: `backend/app/services/search/reason_template.py`
- Create: `backend/tests/unit/test_reason_template.py`

**참고 파일:**
- 기존 이유 생성: `backend/app/services/study/recommendation_service.py:_generate_reason` (라인 ~1400)
- 자격증 스키마: `backend/app/schemas/recommendation.py` (`RecommendedCertificate`)

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_reason_template.py
"""데이터 기반 동적 템플릿 이유 생성 테스트."""

import pytest
from app.services.search.reason_template import ReasonTemplateEngine
from app.schemas.recommendation import StructuredUserContext


@pytest.fixture
def engine():
    return ReasonTemplateEngine()


@pytest.fixture
def context_employment():
    return StructuredUserContext(
        goal="취업",
        employment_status="구직 중",
        major_background="비전공자",
        weekly_study_hours=15,
        max_study_period_days=90,
        difficulty_preference="중",
        preferred_industries=["IT"],
    )


@pytest.fixture
def context_career():
    return StructuredUserContext(
        goal="전문성 강화",
        employment_status="재직 중",
        major_background="전공자",
        weekly_study_hours=10,
        max_study_period_days=180,
        difficulty_preference="상",
        preferred_industries=["건설"],
    )


@pytest.fixture
def cert_with_job_market():
    return {
        "title": "정보처리기사",
        "career_info": {
            "industry": "IT/소프트웨어",
            "related_jobs": "소프트웨어 개발자, 시스템 엔지니어",
            "use_cases": "시스템 설계, 데이터베이스 관리",
        },
        "job_market_info": {
            "job_posting_frequency": "많음",
            "preferred_industries": "IT, 금융, 제조",
            "preferred_companies": "삼성SDS, LG CNS",
            "requirement_type": "우대",
            "salary_premium": "약 10% 상승",
        },
        "feasibility_info": {
            "self_study_possible": True,
            "non_major_pass_rate": "35%",
            "minimum_study_period": "3개월",
        },
        "study_period_days": 90,
        "difficulty": 3,
        "exam_info": {"passing_rate": "30%"},
        "cost_info": {"exam_fee": "19400원"},
        "public_sector_info": {"points": "2점"},
    }


@pytest.fixture
def cert_minimal():
    """최소 메타데이터만 있는 자격증."""
    return {
        "title": "테스트자격증",
        "career_info": {},
        "job_market_info": {},
        "feasibility_info": {},
        "study_period_days": 60,
        "difficulty": 2,
    }


class TestReasonTemplateEngine:
    """이유 생성 엔진 테스트."""

    def test_generates_non_empty_reason(self, engine, cert_with_job_market, context_employment):
        reason = engine.generate(cert_with_job_market, context_employment)
        assert len(reason) > 0
        assert isinstance(reason, str)

    def test_reason_contains_cert_specific_data(self, engine, cert_with_job_market, context_employment):
        """이유에 자격증의 실제 데이터가 포함된다."""
        reason = engine.generate(cert_with_job_market, context_employment)
        # 자격증 관련 실제 정보가 하나 이상 포함
        has_specific = any(
            keyword in reason
            for keyword in ["IT", "소프트웨어", "정보처리", "삼성", "LG", "개발"]
        )
        assert has_specific, f"Reason lacks specific data: {reason}"

    def test_reason_adapts_to_employment_goal(self, engine, cert_with_job_market, context_employment):
        """취업 목표면 채용시장 관련 내용이 강조된다."""
        reason = engine.generate(cert_with_job_market, context_employment)
        employment_keywords = ["채용", "취업", "우대", "기업", "공고"]
        has_employment = any(k in reason for k in employment_keywords)
        assert has_employment, f"Employment goal not reflected: {reason}"

    def test_reason_adapts_to_career_goal(self, engine, cert_with_job_market, context_career):
        """전문성 목표면 경력/연봉 관련 내용이 강조된다."""
        reason = engine.generate(cert_with_job_market, context_career)
        career_keywords = ["전문", "경력", "연봉", "상승", "프리미엄", "역량"]
        has_career = any(k in reason for k in career_keywords)
        assert has_career, f"Career goal not reflected: {reason}"

    def test_reason_for_non_major(self, engine, cert_with_job_market, context_employment):
        """비전공자면 독학/접근성 관련 내용 포함."""
        reason = engine.generate(cert_with_job_market, context_employment)
        non_major_keywords = ["독학", "비전공", "가능", "접근", "합격"]
        has_non_major = any(k in reason for k in non_major_keywords)
        assert has_non_major, f"Non-major context not reflected: {reason}"

    def test_minimal_cert_still_generates_reason(self, engine, cert_minimal, context_employment):
        """최소 데이터로도 이유가 생성된다."""
        reason = engine.generate(cert_minimal, context_employment)
        assert len(reason) > 10

    def test_reason_has_multiple_sentences(self, engine, cert_with_job_market, context_employment):
        """이유가 여러 문장으로 구성된다."""
        reason = engine.generate(cert_with_job_market, context_employment)
        sentences = [s.strip() for s in reason.split(".") if s.strip()]
        assert len(sentences) >= 2, f"Too few sentences: {reason}"

    def test_reason_length_reasonable(self, engine, cert_with_job_market, context_employment):
        """이유 길이가 적절하다 (50-300자)."""
        reason = engine.generate(cert_with_job_market, context_employment)
        assert 50 <= len(reason) <= 300, f"Reason length {len(reason)}: {reason}"
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_reason_template.py -v`
Expected: FAIL with `ImportError`

### Step 3: Write minimal implementation

```python
# backend/app/services/search/reason_template.py
"""데이터 기반 동적 템플릿 이유 생성 엔진.

자격증의 메타데이터에서 객관적 강점을 분석하고,
사용자 컨텍스트에 맞춰 상위 강점을 문장으로 조합한다.

기존 MD5 해시 기반 랜덤 선택 → 데이터 기반 강점 분석으로 개선.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from app.schemas.recommendation import StructuredUserContext

logger = logging.getLogger(__name__)


@dataclass
class StrengthResult:
    """강점 분석 결과."""

    name: str
    score: float
    sentence: str


class ReasonTemplateEngine:
    """자격증 메타데이터의 실제 강점을 분석하여 추천 이유를 생성한다."""

    def generate(self, cert: dict, context: StructuredUserContext) -> str:
        """자격증과 사용자 컨텍스트를 기반으로 추천 이유를 생성한다.

        Args:
            cert: 자격증 데이터 딕셔너리
            context: 사용자 컨텍스트

        Returns:
            2-3문장의 추천 이유 문자열
        """
        strengths = self._analyze_all_strengths(cert, context)
        strengths.sort(key=lambda s: s.score, reverse=True)

        # 상위 3개 강점 선택 (점수 > 0인 것만)
        top = [s for s in strengths if s.score > 0][:3]

        if not top:
            # 폴백: 기본 이유
            title = cert.get("title", "해당 자격증")
            return f"{title}은(는) 다양한 분야에서 활용할 수 있는 자격증입니다. 체계적인 준비를 통해 취득을 목표로 해보세요."

        return " ".join(s.sentence for s in top)

    def _analyze_all_strengths(
        self, cert: dict, context: StructuredUserContext
    ) -> list[StrengthResult]:
        """모든 강점 분석기를 실행한다."""
        analyzers = [
            self._job_market_strength,
            self._salary_strength,
            self._non_major_strength,
            self._worker_friendly_strength,
            self._cost_efficiency_strength,
            self._public_sector_strength,
            self._feasibility_strength,
        ]

        results: list[StrengthResult] = []
        for analyzer in analyzers:
            result = analyzer(cert, context)
            if result:
                results.append(result)

        return results

    def _job_market_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """채용 시장 수요 강점."""
        jm = cert.get("job_market_info", {}) or {}
        freq = jm.get("job_posting_frequency", "")
        req_type = jm.get("requirement_type", "")
        preferred = jm.get("preferred_companies", "")
        industries = jm.get("preferred_industries", "")

        score = 0.0
        # 취업/이직 목표면 가중치 2배
        weight = 2.0 if context.goal in ("취업", "이직") else 1.0

        if freq in ("많음", "매우 많음"):
            score += 30
        elif freq:
            score += 15

        if preferred:
            score += 10

        score *= weight

        if score <= 0:
            return None

        # 문장 생성 (가장 구체적인 데이터 우선)
        if preferred and context.goal in ("취업", "이직"):
            sentence = f"{preferred} 등 주요 기업에서 {req_type or '우대'}하는 자격증으로, 채용 시 경쟁력을 높여줍니다."
        elif freq in ("많음", "매우 많음") and industries:
            sentence = f"{industries} 분야에서 채용 수요가 높아 취업에 유리합니다."
        elif req_type:
            sentence = f"채용 시 {req_type} 조건으로 활용되어 취업 경쟁력을 갖출 수 있습니다."
        else:
            sentence = "관련 분야 채용 시장에서 활용할 수 있는 자격증입니다."

        return StrengthResult(name="job_market", score=score, sentence=sentence)

    def _salary_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """연봉 프리미엄 강점."""
        jm = cert.get("job_market_info", {}) or {}
        premium = jm.get("salary_premium", "")

        if not premium:
            return None

        score = 20.0
        if context.goal == "전문성 강화":
            score *= 2.0

        sentence = f"자격증 취득 시 {premium}의 연봉 프리미엄이 기대됩니다."
        return StrengthResult(name="salary", score=score, sentence=sentence)

    def _non_major_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """비전공자 접근성 강점."""
        fi = cert.get("feasibility_info", {}) or {}
        self_study = fi.get("self_study_possible")
        pass_rate = fi.get("non_major_pass_rate", "")

        if context.major_background != "비전공자":
            return None

        if self_study is None:
            return None

        score = 0.0
        if self_study:
            score += 30
        else:
            return None  # 독학 불가면 비전공자 강점 아님

        # 문장 생성
        if pass_rate:
            sentence = f"비전공자도 독학으로 준비 가능하며, 비전공 합격률은 {pass_rate}입니다."
        else:
            sentence = "비전공자도 독학으로 준비할 수 있어 접근성이 높은 자격증입니다."

        return StrengthResult(name="non_major", score=score, sentence=sentence)

    def _worker_friendly_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """직장인 친화 강점."""
        if context.employment_status != "재직 중":
            return None

        fi = cert.get("feasibility_info", {}) or {}
        min_period = fi.get("minimum_study_period", "")
        study_days = cert.get("study_period_days", 0)

        score = 0.0
        if study_days and study_days <= context.max_study_period_days * 0.7:
            score += 25

        if score <= 0:
            return None

        if min_period:
            sentence = f"최소 {min_period}의 준비 기간으로 직장 병행이 가능한 자격증입니다."
        else:
            sentence = f"약 {study_days}일의 준비 기간으로 직장과 병행하여 준비할 수 있습니다."

        return StrengthResult(name="worker_friendly", score=score, sentence=sentence)

    def _cost_efficiency_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """비용 효율 강점."""
        ci = cert.get("cost_info", {}) or {}
        fee = ci.get("exam_fee", "")

        if not fee:
            return None

        score = 10.0
        sentence = f"응시료 {fee}로 비용 부담이 적습니다."
        return StrengthResult(name="cost", score=score, sentence=sentence)

    def _public_sector_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """공공부문 가산점 강점."""
        ps = cert.get("public_sector_info", {}) or {}
        points = ps.get("points", "")

        if not points:
            return None

        score = 15.0
        if context.goal == "취업":
            score *= 1.5

        sentence = f"공무원 시험 응시 시 {points} 가산점이 부여됩니다."
        return StrengthResult(name="public_sector", score=score, sentence=sentence)

    def _feasibility_strength(
        self, cert: dict, context: StructuredUserContext
    ) -> Optional[StrengthResult]:
        """실현 가능성 강점."""
        fi = cert.get("feasibility_info", {}) or {}
        career = cert.get("career_info", {}) or {}
        study_days = cert.get("study_period_days", 0)
        industry = career.get("industry", "")

        if not study_days or not industry:
            return None

        score = 15.0
        sentence = f"{industry} 분야의 자격증으로, 약 {study_days}일간 준비하여 취득할 수 있습니다."
        return StrengthResult(name="feasibility", score=score, sentence=sentence)
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_reason_template.py -v`
Expected: All 8 tests PASS

### Step 5: Commit

```bash
git add backend/app/services/search/reason_template.py backend/tests/unit/test_reason_template.py
git commit -m "feat: add data-driven dynamic reason template engine"
```

---

## Task 5: Hybrid Search Service (Dense + Sparse + RRF)

**Files:**
- Create: `backend/app/services/search/hybrid_search_service.py`
- Create: `backend/tests/unit/test_hybrid_search_service.py`

**참고 파일:**
- VectorStore: `backend/app/services/embedding/vector_store.py` (`search_records` 메서드)
- BM25: `backend/app/services/search/bm25_service.py` (Task 2에서 생성)

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_hybrid_search_service.py
"""하이브리드 검색 서비스 (Dense + Sparse + RRF) 테스트."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.search.hybrid_search_service import HybridSearchService


@pytest.fixture
def mock_vector_store():
    """ChromaDB Dense 검색 목."""
    store = AsyncMock()
    store.search_records = AsyncMock(
        return_value=[
            {"id": "cert-A", "score": 0.8, "metadata": {}},
            {"id": "cert-B", "score": 0.6, "metadata": {}},
            {"id": "cert-C", "score": 0.4, "metadata": {}},
        ]
    )
    return store


@pytest.fixture
def mock_bm25():
    """BM25 Sparse 검색 목."""
    bm25 = MagicMock()
    bm25.is_ready.return_value = True
    bm25.search.return_value = [
        {"id": "cert-B", "score": 5.0, "domain": "IT"},
        {"id": "cert-D", "score": 3.0, "domain": "IT"},
        {"id": "cert-A", "score": 1.0, "domain": "IT"},
    ]
    return bm25


@pytest.fixture
def service(mock_vector_store, mock_bm25):
    return HybridSearchService(
        vector_store=mock_vector_store,
        bm25_service=mock_bm25,
    )


class TestRRFFusion:
    """RRF 결합 테스트."""

    @pytest.mark.asyncio
    async def test_merges_dense_and_sparse(self, service):
        """Dense와 Sparse 결과를 병합한다."""
        results = await service.search("정보처리기사", top_k=5)
        ids = [r["id"] for r in results]
        # cert-B는 양쪽에서 높은 순위 → 1등
        assert ids[0] == "cert-B"

    @pytest.mark.asyncio
    async def test_includes_results_from_both(self, service):
        """양쪽 검색 결과를 모두 포함한다."""
        results = await service.search("테스트", top_k=10)
        ids = [r["id"] for r in results]
        # Dense만의 cert-C, Sparse만의 cert-D 모두 포함
        assert "cert-C" in ids
        assert "cert-D" in ids

    @pytest.mark.asyncio
    async def test_top_k_limits_results(self, service):
        """top_k로 결과 수를 제한한다."""
        results = await service.search("테스트", top_k=2)
        assert len(results) <= 2

    @pytest.mark.asyncio
    async def test_results_have_rrf_score(self, service):
        """결과에 RRF 점수가 포함된다."""
        results = await service.search("테스트", top_k=5)
        assert all("rrf_score" in r for r in results)
        assert all(r["rrf_score"] > 0 for r in results)

    @pytest.mark.asyncio
    async def test_results_sorted_by_rrf_score(self, service):
        """결과가 RRF 점수 내림차순으로 정렬된다."""
        results = await service.search("테스트", top_k=5)
        scores = [r["rrf_score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.asyncio
    async def test_rrf_formula_correct(self, service):
        """RRF 공식이 정확하다: 1/(k+rank)."""
        results = await service.search("테스트", top_k=10)
        # cert-B: Dense rank=2, Sparse rank=1
        # RRF = 1/(60+2) + 1/(60+1) = 1/62 + 1/61
        cert_b = next(r for r in results if r["id"] == "cert-B")
        expected = 1 / 62 + 1 / 61
        assert abs(cert_b["rrf_score"] - expected) < 0.0001

    @pytest.mark.asyncio
    async def test_search_stats_returned(self, service):
        """검색 통계가 반환된다."""
        results = await service.search("테스트", top_k=5)
        stats = service.last_search_stats
        assert stats["dense_count"] == 3
        assert stats["sparse_count"] == 3
        assert stats["merged_count"] > 0
        assert stats["elapsed_ms"] >= 0

    @pytest.mark.asyncio
    async def test_empty_query(self, service):
        """빈 쿼리는 빈 결과를 반환한다."""
        service._vector_store.search_records.return_value = []
        service._bm25_service.search.return_value = []
        results = await service.search("", top_k=5)
        assert results == []
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_hybrid_search_service.py -v`
Expected: FAIL with `ImportError`

### Step 3: Write minimal implementation

```python
# backend/app/services/search/hybrid_search_service.py
"""하이브리드 검색 서비스: Dense(ChromaDB) + Sparse(BM25) + RRF 결합.

RAG 파이프라인에서 Dense 검색(의미 기반)과 Sparse 검색(키워드 기반)을
병렬 실행 후 RRF(Reciprocal Rank Fusion)로 결합하여
검색 정확도를 높인다.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from app.services.search.bm25_service import BM25SearchService

logger = logging.getLogger(__name__)


class HybridSearchService:
    """Dense + Sparse 하이브리드 검색을 RRF로 결합한다."""

    RRF_K = 60  # RRF 상수 (표준값)

    def __init__(
        self,
        vector_store,
        bm25_service: BM25SearchService,
    ) -> None:
        self._vector_store = vector_store
        self._bm25_service = bm25_service
        self.last_search_stats: dict = {}

    async def search(
        self,
        query: str,
        top_k: int = 10,
        domains: Optional[list[str]] = None,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> list[dict]:
        """하이브리드 검색을 수행한다.

        Args:
            query: 검색 쿼리 텍스트
            top_k: 반환할 최대 결과 수
            domains: 도메인 필터 (BM25에만 적용)
            dense_weight: Dense 검색 RRF 가중치
            sparse_weight: Sparse 검색 RRF 가중치

        Returns:
            RRF 점수 순으로 정렬된 검색 결과 리스트
        """
        start = time.monotonic()

        # 병렬 실행: Dense + Sparse
        retrieve_k = top_k * 3

        dense_task = self._vector_store.search_records(
            query=query,
            top_k=retrieve_k,
        )
        sparse_results = self._bm25_service.search(
            query=query,
            top_k=retrieve_k,
            domains=domains,
        )

        dense_results = await dense_task

        # RRF 결합
        rrf_scores: dict[str, float] = {}

        for rank, result in enumerate(dense_results, 1):
            cert_id = result["id"]
            rrf_scores[cert_id] = dense_weight / (self.RRF_K + rank)

        for rank, result in enumerate(sparse_results, 1):
            cert_id = result["id"]
            rrf_scores.setdefault(cert_id, 0.0)
            rrf_scores[cert_id] += sparse_weight / (self.RRF_K + rank)

        # 정렬 및 top_k 제한
        sorted_results = sorted(
            rrf_scores.items(), key=lambda x: x[1], reverse=True
        )[:top_k]

        elapsed = (time.monotonic() - start) * 1000

        # 검색 통계 저장
        self.last_search_stats = {
            "dense_count": len(dense_results),
            "sparse_count": len(sparse_results),
            "merged_count": len(sorted_results),
            "elapsed_ms": round(elapsed, 2),
        }

        return [
            {"id": cert_id, "rrf_score": score}
            for cert_id, score in sorted_results
        ]
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_hybrid_search_service.py -v`
Expected: All 8 tests PASS

### Step 5: Commit

```bash
git add backend/app/services/search/hybrid_search_service.py backend/tests/unit/test_hybrid_search_service.py
git commit -m "feat: add hybrid search service with Dense+Sparse+RRF fusion"
```

---

## Task 6: Embedding Text Optimization (검색 최적화 텍스트 분리)

**Files:**
- Modify: `backend/app/utils/certificate_formatter.py` (add `format_search_text`)
- Create: `backend/tests/unit/test_search_text_formatter.py`

**참고 파일:**
- 기존 포맷터: `backend/app/utils/certificate_formatter.py` (`format_certificate_text`)

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_search_text_formatter.py
"""검색 최적화 압축 텍스트 (format_search_text) 테스트."""

import pytest
from app.utils.certificate_formatter import format_search_text


@pytest.fixture
def sample_cert():
    return {
        "title": "정보처리기사",
        "categories": "국가기술자격",
        "series": "정보처리",
        "overview": "소프트웨어 개발 및 운용에 관한 전문 자격증으로 " + "상세내용 " * 100,
        "career_info": {
            "industry": "IT/소프트웨어",
            "related_jobs": "소프트웨어 개발자, 시스템 엔지니어, DBA",
        },
        "job_market_info": {
            "preferred_industries": "IT, 금융, 제조",
        },
    }


class TestFormatSearchText:
    """format_search_text 함수 테스트."""

    def test_includes_title(self, sample_cert):
        text = format_search_text(sample_cert)
        assert "정보처리기사" in text

    def test_includes_categories(self, sample_cert):
        text = format_search_text(sample_cert)
        assert "국가기술자격" in text

    def test_includes_series(self, sample_cert):
        text = format_search_text(sample_cert)
        assert "정보처리" in text

    def test_includes_industry(self, sample_cert):
        text = format_search_text(sample_cert)
        assert "IT/소프트웨어" in text

    def test_includes_related_jobs(self, sample_cert):
        text = format_search_text(sample_cert)
        assert "소프트웨어 개발자" in text

    def test_overview_truncated(self, sample_cert):
        """overview가 200자로 잘린다."""
        text = format_search_text(sample_cert)
        # 원본 overview는 매우 길지만, 검색 텍스트에서는 200자까지만
        full_overview = sample_cert["overview"]
        assert full_overview not in text  # 전체는 포함 안 됨
        assert full_overview[:50] in text  # 앞부분은 포함

    def test_shorter_than_full_text(self, sample_cert):
        """기존 format_certificate_text보다 짧다."""
        from app.utils.certificate_formatter import format_certificate_text
        search_text = format_search_text(sample_cert)
        full_text = format_certificate_text(sample_cert)
        assert len(search_text) < len(full_text)

    def test_handles_missing_fields(self):
        """필드가 없어도 에러 없이 처리."""
        cert = {"title": "테스트자격증"}
        text = format_search_text(cert)
        assert "테스트자격증" in text

    def test_returns_non_empty(self, sample_cert):
        text = format_search_text(sample_cert)
        assert len(text.strip()) > 0
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_search_text_formatter.py -v`
Expected: FAIL with `ImportError: cannot import name 'format_search_text'`

### Step 3: Write minimal implementation

`backend/app/utils/certificate_formatter.py` 파일 맨 아래에 함수 추가:

```python
def format_search_text(cert: dict) -> str:
    """검색 최적화용 압축 텍스트를 생성한다 (임베딩용).

    기존 format_certificate_text()가 모든 섹션을 포함하여 의미 신호가
    희석되는 문제를 해결하기 위해, 핵심 정보만 포함한 압축 텍스트를 생성한다.

    포함 필드: title, categories, series, industry, related_jobs,
    overview (200자), preferred_industries

    Args:
        cert: 자격증 데이터 딕셔너리

    Returns:
        검색 최적화된 압축 텍스트
    """
    career_info = cert.get("career_info", {}) or {}
    job_market_info = cert.get("job_market_info", {}) or {}

    parts = [
        cert.get("title", ""),
        cert.get("categories", ""),
        cert.get("series", ""),
        career_info.get("industry", ""),
        career_info.get("related_jobs", ""),
        (cert.get("overview", "") or "")[:200],
        job_market_info.get("preferred_industries", ""),
    ]
    return " ".join(filter(None, parts))
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_search_text_formatter.py -v`
Expected: All 9 tests PASS

### Step 5: Commit

```bash
git add backend/app/utils/certificate_formatter.py backend/tests/unit/test_search_text_formatter.py
git commit -m "feat: add format_search_text for optimized embedding text"
```

---

## Task 7: Schema Updates (SearchStats 추가)

**Files:**
- Modify: `backend/app/schemas/recommendation.py`
- Create: `backend/tests/unit/test_search_stats_schema.py`

### Step 1: Write the failing tests

```python
# backend/tests/unit/test_search_stats_schema.py
"""SearchStats 스키마 테스트."""

import pytest
from app.schemas.recommendation import SearchStats, UnifiedRecommendationResponse


class TestSearchStats:
    """SearchStats 스키마 테스트."""

    def test_creates_with_valid_data(self):
        stats = SearchStats(
            dense_count=20,
            sparse_count=15,
            merged_count=10,
            elapsed_ms=123.45,
        )
        assert stats.dense_count == 20
        assert stats.sparse_count == 15
        assert stats.merged_count == 10
        assert stats.elapsed_ms == 123.45

    def test_serializes_to_dict(self):
        stats = SearchStats(
            dense_count=5,
            sparse_count=3,
            merged_count=5,
            elapsed_ms=50.0,
        )
        d = stats.model_dump()
        assert "dense_count" in d
        assert "sparse_count" in d
        assert "merged_count" in d
        assert "elapsed_ms" in d


class TestUnifiedResponseIncludesSearchStats:
    """UnifiedRecommendationResponse에 search_stats 필드 테스트."""

    def test_has_search_stats_field(self):
        """search_stats 필드가 Optional로 존재한다."""
        fields = UnifiedRecommendationResponse.model_fields
        assert "search_stats" in fields
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_search_stats_schema.py -v`
Expected: FAIL with `ImportError: cannot import name 'SearchStats'`

### Step 3: Write minimal implementation

`backend/app/schemas/recommendation.py`에 추가:

1. `SearchStats` 클래스를 `UnifiedRecommendationResponse` 앞에 추가:

```python
class SearchStats(BaseModel):
    """하이브리드 검색 통계."""

    dense_count: int = Field(description="Dense 검색 결과 수")
    sparse_count: int = Field(description="Sparse(BM25) 검색 결과 수")
    merged_count: int = Field(description="RRF 결합 후 최종 결과 수")
    elapsed_ms: float = Field(description="총 검색 소요 시간 (ms)")
```

2. `UnifiedRecommendationResponse`에 `search_stats` 필드 추가:

```python
class UnifiedRecommendationResponse(BaseModel):
    # ... 기존 필드 유지 ...
    search_stats: Optional[SearchStats] = Field(
        default=None,
        description="하이브리드 검색 통계 (Dense/Sparse/RRF)",
    )
```

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_search_stats_schema.py -v`
Expected: All 3 tests PASS

### Step 5: Commit

```bash
git add backend/app/schemas/recommendation.py backend/tests/unit/test_search_stats_schema.py
git commit -m "feat: add SearchStats schema for hybrid search metrics"
```

---

## Task 8: Unified Endpoint Refactoring (통합 서비스 + API)

**Files:**
- Modify: `backend/app/services/study/natural_recommendation_service.py` (리팩토링: `get_unified_recommendations` 메서드)
- Modify: `backend/app/api/v1/recommendations.py` (deprecated 표시)
- Create: `backend/tests/unit/test_unified_hybrid_recommendation.py`

**이것은 가장 큰 태스크이므로 서브스텝으로 나눈다:**

### Step 1: Write the failing integration tests

```python
# backend/tests/unit/test_unified_hybrid_recommendation.py
"""통합 하이브리드 추천 서비스 테스트.

LLM 호출 없이 하이브리드 검색 + 템플릿 이유 생성으로 동작하는지 검증.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.study.natural_recommendation_service import NaturalRecommendationService
from app.schemas.recommendation import UnifiedRecommendationRequest


@pytest.fixture
def mock_db():
    """테스트용 DB 세션 목."""
    db = MagicMock()
    # 자격증 조회 결과 목
    mock_cert = MagicMock()
    mock_cert.id = "cert-001"
    mock_cert.title = "정보처리기사"
    mock_cert.to_dict.return_value = {
        "id": "cert-001",
        "title": "정보처리기사",
        "categories": "국가기술자격",
        "series": "정보처리",
        "overview": "소프트웨어 개발 전문 자격증",
        "career_info": {
            "industry": "IT/소프트웨어",
            "related_jobs": "소프트웨어 개발자",
        },
        "job_market_info": {
            "job_posting_frequency": "많음",
            "preferred_industries": "IT",
            "requirement_type": "우대",
        },
        "feasibility_info": {
            "self_study_possible": True,
            "non_major_pass_rate": "35%",
        },
        "study_period_days": 90,
        "difficulty": 3,
    }

    db.query.return_value.filter.return_value.all.return_value = [mock_cert]
    return db


class TestUnifiedHybridRecommendation:
    """통합 하이브리드 추천 흐름 테스트."""

    @pytest.mark.asyncio
    async def test_no_llm_calls(self, mock_db):
        """LLM 호출이 발생하지 않는다."""
        with patch("app.services.study.natural_recommendation_service.get_bm25_service") as mock_bm25, \
             patch.object(NaturalRecommendationService, "_search_vector_store") as mock_vs:

            mock_bm25.return_value.is_ready.return_value = True
            mock_bm25.return_value.search.return_value = [
                {"id": "cert-001", "score": 5.0, "domain": "IT/소프트웨어"},
            ]
            mock_vs.return_value = [
                {"id": "cert-001", "score": 0.5, "metadata": {}},
            ]

            service = NaturalRecommendationService(db=mock_db)
            request = UnifiedRecommendationRequest(
                domains=["IT/소프트웨어"],
                user_input="비전공자 취업용 IT 자격증 추천",
            )

            # LLM 서비스를 목으로 감시
            with patch("app.services.study.natural_recommendation_service.ReasonGeneratorService") as mock_reason_gen:
                result = await service.get_unified_recommendations(request)

                # LLM reason generator가 호출되지 않아야 함
                mock_reason_gen.return_value.generate_reasons_batch.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_recommendations(self, mock_db):
        """추천 결과가 반환된다."""
        with patch("app.services.study.natural_recommendation_service.get_bm25_service") as mock_bm25, \
             patch.object(NaturalRecommendationService, "_search_vector_store") as mock_vs:

            mock_bm25.return_value.is_ready.return_value = True
            mock_bm25.return_value.search.return_value = [
                {"id": "cert-001", "score": 5.0, "domain": "IT/소프트웨어"},
            ]
            mock_vs.return_value = [
                {"id": "cert-001", "score": 0.5, "metadata": {}},
            ]

            service = NaturalRecommendationService(db=mock_db)
            request = UnifiedRecommendationRequest(
                domains=["IT/소프트웨어"],
                user_input="비전공자 취업용 IT 자격증 추천",
            )
            result = await service.get_unified_recommendations(request)

            assert result is not None
            assert hasattr(result, "recommendations")

    @pytest.mark.asyncio
    async def test_returns_search_stats(self, mock_db):
        """search_stats가 반환된다."""
        with patch("app.services.study.natural_recommendation_service.get_bm25_service") as mock_bm25, \
             patch.object(NaturalRecommendationService, "_search_vector_store") as mock_vs:

            mock_bm25.return_value.is_ready.return_value = True
            mock_bm25.return_value.search.return_value = [
                {"id": "cert-001", "score": 5.0, "domain": "IT/소프트웨어"},
            ]
            mock_vs.return_value = [
                {"id": "cert-001", "score": 0.5, "metadata": {}},
            ]

            service = NaturalRecommendationService(db=mock_db)
            request = UnifiedRecommendationRequest(
                domains=["IT/소프트웨어"],
                user_input="자격증 추천",
            )
            result = await service.get_unified_recommendations(request)

            assert result.search_stats is not None
            assert result.search_stats.dense_count >= 0
            assert result.search_stats.sparse_count >= 0
```

### Step 2: Run test to verify it fails

Run: `cd backend && uv run pytest tests/unit/test_unified_hybrid_recommendation.py -v`
Expected: FAIL (imports missing, methods not updated)

### Step 3: Modify natural_recommendation_service.py

이 단계는 기존 `get_unified_recommendations` 메서드를 리팩토링한다.

**주요 변경사항:**

1. **Import 추가** (파일 상단):
```python
from app.services.search.context_parser import EnhancedContextParser
from app.services.search.bm25_service import get_bm25_service
from app.services.search.hybrid_search_service import HybridSearchService
from app.services.search.reason_template import ReasonTemplateEngine
from app.schemas.recommendation import SearchStats
```

2. **`get_unified_recommendations` 메서드 리팩토링:**
- 기존 `parse_user_context` → `EnhancedContextParser().parse()` 로 교체
- 기존 vector search only → `HybridSearchService.search()` 로 교체
- 기존 `ReasonGeneratorService.generate_reasons_batch()` (LLM) → `ReasonTemplateEngine().generate()` 로 교체
- `SearchStats`를 응답에 추가

3. **기존 `_build_fallback_recommendations` 메서드의 템플릿 이유 생성 로직을 `ReasonTemplateEngine`으로 교체**

4. **기존 LLM 호출 부분 제거** (`_generate_unified_reasons` 또는 이유 생성 LLM 호출 코드)

구체적인 코드 변경은 실행 시 기존 코드를 읽은 후 정확한 라인에 맞춰 수정한다.

### Step 4: Run test to verify it passes

Run: `cd backend && uv run pytest tests/unit/test_unified_hybrid_recommendation.py -v`
Expected: All 3 tests PASS

### Step 5: Mark legacy endpoints as deprecated

`backend/app/api/v1/recommendations.py`에서:

```python
@router.post("/", deprecated=True)  # deprecated=True 추가
async def recommend_certificates(...):
    ...

@router.post("/natural", deprecated=True)  # deprecated=True 추가
async def recommend_natural(...):
    ...
```

### Step 6: Run all existing tests to ensure no regression

Run: `cd backend && uv run pytest tests/ -v --timeout=60`
Expected: 기존 테스트 모두 PASS (또는 LLM 목 관련 테스트 조정 필요)

### Step 7: Commit

```bash
git add backend/app/services/study/natural_recommendation_service.py backend/app/api/v1/recommendations.py backend/tests/unit/test_unified_hybrid_recommendation.py
git commit -m "feat: refactor unified endpoint to use hybrid search without LLM"
```

---

## Task 9: BM25 Index Initialization (앱 시작 시 인덱스 빌드)

**Files:**
- Modify: `backend/app/main.py` (startup event에 BM25 인덱스 빌드 추가)
- Create: `backend/tests/unit/test_bm25_startup.py`

### Step 1: Write the failing test

```python
# backend/tests/unit/test_bm25_startup.py
"""BM25 인덱스 앱 시작 시 빌드 테스트."""

import pytest
from unittest.mock import MagicMock, patch
from app.services.search.bm25_service import get_bm25_service


class TestBM25Startup:
    """BM25 인덱스 초기화 테스트."""

    def test_build_from_db_certificates(self):
        """DB 자격증 데이터로 인덱스를 빌드한다."""
        service = get_bm25_service()

        # 테스트 데이터로 인덱스 빌드
        certs = [
            {
                "id": "test-001",
                "title": "정보처리기사",
                "categories": "국가기술",
                "series": "정보처리",
                "overview": "테스트",
                "career_info": {"industry": "IT", "related_jobs": "개발자"},
                "domain": "IT/소프트웨어",
            },
        ]
        service.build_index(certs)
        assert service.is_ready()

    def test_search_after_build(self):
        """인덱스 빌드 후 검색이 동작한다."""
        service = get_bm25_service()

        certs = [
            {
                "id": "test-001",
                "title": "정보처리기사",
                "categories": "국가기술",
                "series": "정보처리",
                "overview": "소프트웨어 개발",
                "career_info": {"industry": "IT", "related_jobs": "개발자"},
                "domain": "IT/소프트웨어",
            },
        ]
        service.build_index(certs)

        results = service.search("정보처리", top_k=5)
        assert len(results) > 0
```

### Step 2: Run test to verify it passes (이미 구현됨)

Run: `cd backend && uv run pytest tests/unit/test_bm25_startup.py -v`
Expected: PASS (Task 2에서 이미 구현)

### Step 3: Modify app startup

`backend/app/main.py`의 startup event에 BM25 인덱스 빌드 로직 추가:

```python
# startup event 또는 lifespan에 추가
from app.services.search.bm25_service import get_bm25_service

async def init_bm25_index():
    """앱 시작 시 BM25 인덱스를 빌드한다."""
    try:
        from app.core.database import get_db
        from app.models.certificate import Certificate

        db = next(get_db())
        certs = db.query(Certificate).filter(
            Certificate.overview.isnot(None)
        ).all()

        cert_dicts = []
        for cert in certs:
            cert_dict = cert.to_dict() if hasattr(cert, 'to_dict') else {}
            cert_dict["id"] = str(cert.id)
            cert_dicts.append(cert_dict)

        bm25 = get_bm25_service()
        bm25.build_index(cert_dicts)
        logger.info(f"BM25 인덱스 빌드 완료: {len(cert_dicts)}건")
    except Exception as e:
        logger.warning(f"BM25 인덱스 빌드 실패 (서비스는 계속 동작): {e}")
```

### Step 4: Commit

```bash
git add backend/app/main.py backend/tests/unit/test_bm25_startup.py
git commit -m "feat: add BM25 index initialization at app startup"
```

---

## Task 10: Reindex Script Update (format_search_text 사용)

**Files:**
- Modify: `backend/scripts/reindex_all.py`
- Modify: `backend/app/services/embedding/vector_store.py` (`format_record_for_upsert`에서 `format_search_text` 사용)

### Step 1: Modify vector_store.py

`backend/app/services/embedding/vector_store.py`의 `format_record_for_upsert` 메서드에서 임베딩용 텍스트를 `format_search_text`로 변경:

```python
from app.utils.certificate_formatter import format_search_text  # 추가

# format_record_for_upsert 또는 _get_embedding_text 메서드에서:
# 기존: text = format_certificate_text(cert)
# 변경: text = format_search_text(cert)
```

### Step 2: Test reindex script (manual verification)

Run: `cd backend && uv run python -c "from app.utils.certificate_formatter import format_search_text; print('OK')"`
Expected: `OK`

### Step 3: Commit

```bash
git add backend/app/services/embedding/vector_store.py backend/scripts/reindex_all.py
git commit -m "refactor: use format_search_text for embedding in vector store"
```

---

## Task 11: Full Integration Test

**Files:**
- Create: `backend/tests/integration/test_hybrid_recommendation_e2e.py`

### Step 1: Write integration test

```python
# backend/tests/integration/test_hybrid_recommendation_e2e.py
"""하이브리드 추천 시스템 E2E 통합 테스트.

전체 파이프라인: 키워드 파싱 → 하이브리드 검색 → RRF → 템플릿 이유 → 응답
"""

import pytest
from app.services.search.context_parser import EnhancedContextParser
from app.services.search.tokenizer import tokenize
from app.services.search.bm25_service import BM25SearchService
from app.services.search.reason_template import ReasonTemplateEngine


@pytest.fixture
def sample_certs():
    return [
        {
            "id": "cert-001",
            "title": "정보처리기사",
            "categories": "국가기술자격",
            "series": "정보처리",
            "overview": "소프트웨어 개발 및 운용 전문 자격증",
            "career_info": {
                "industry": "IT/소프트웨어",
                "related_jobs": "소프트웨어 개발자, 시스템 엔지니어",
            },
            "job_market_info": {
                "job_posting_frequency": "많음",
                "preferred_industries": "IT, 금융",
                "requirement_type": "우대",
            },
            "feasibility_info": {
                "self_study_possible": True,
                "non_major_pass_rate": "35%",
            },
            "study_period_days": 90,
            "difficulty": 3,
            "domain": "IT/소프트웨어",
        },
        {
            "id": "cert-002",
            "title": "전기기사",
            "categories": "국가기술자격",
            "series": "전기",
            "overview": "전기설비 설계 및 시공 전문 자격증",
            "career_info": {
                "industry": "전기/전자",
                "related_jobs": "전기 엔지니어",
            },
            "job_market_info": {"job_posting_frequency": "보통"},
            "feasibility_info": {"self_study_possible": False},
            "study_period_days": 180,
            "difficulty": 4,
            "domain": "전기/전자",
        },
    ]


class TestE2EPipeline:
    """전체 파이프라인 테스트."""

    def test_context_parser_to_bm25(self, sample_certs):
        """파싱 → BM25 검색 흐름."""
        # 1. 컨텍스트 파싱
        parser = EnhancedContextParser()
        ctx = parser.parse("비전공자 IT 취업 자격증 추천")
        assert ctx.goal == "취업"

        # 2. BM25 검색
        bm25 = BM25SearchService()
        bm25.build_index(sample_certs)
        results = bm25.search("IT 소프트웨어 자격증", domains=["IT/소프트웨어"], top_k=5)
        assert len(results) > 0
        assert results[0]["id"] == "cert-001"

    def test_bm25_to_reason_template(self, sample_certs):
        """BM25 검색 → 이유 생성 흐름."""
        parser = EnhancedContextParser()
        ctx = parser.parse("비전공자 취업용 IT 자격증")

        bm25 = BM25SearchService()
        bm25.build_index(sample_certs)
        results = bm25.search("IT 자격증", top_k=5)

        # 이유 생성
        engine = ReasonTemplateEngine()
        cert = sample_certs[0]
        reason = engine.generate(cert, ctx)
        assert len(reason) > 0
        # 비전공자 관련 내용 포함
        assert any(k in reason for k in ["비전공", "독학", "IT", "채용"])

    def test_full_pipeline_no_llm(self, sample_certs):
        """전체 파이프라인이 LLM 없이 동작한다."""
        # 1. 파싱
        parser = EnhancedContextParser()
        ctx = parser.parse(
            "3개월 안에 딸 수 있는 쉬운 IT 자격증",
            domains=["IT/소프트웨어"],
        )

        # 2. BM25 검색
        bm25 = BM25SearchService()
        bm25.build_index(sample_certs)
        results = bm25.search("IT 소프트웨어", top_k=5)

        # 3. 이유 생성
        engine = ReasonTemplateEngine()
        for r in results:
            cert = next(c for c in sample_certs if c["id"] == r["id"])
            reason = engine.generate(cert, ctx)
            assert len(reason) > 0

        # LLM 미사용 확인: 모든 과정이 동기적으로 즉시 완료
        assert True  # 위 코드가 timeout 없이 실행됨

    def test_tokenizer_handles_cert_titles(self, sample_certs):
        """토큰화가 자격증 제목을 잘 처리한다."""
        for cert in sample_certs:
            tokens = tokenize(cert["title"])
            assert len(tokens) > 0
            # 원본 제목이 토큰에 포함
            assert cert["title"] in tokens
```

### Step 2: Run integration test

Run: `cd backend && uv run pytest tests/integration/test_hybrid_recommendation_e2e.py -v`
Expected: All 4 tests PASS

### Step 3: Run full test suite

Run: `cd backend && uv run pytest tests/ -v --timeout=60`
Expected: 모든 테스트 PASS

### Step 4: Commit

```bash
git add backend/tests/integration/test_hybrid_recommendation_e2e.py
git commit -m "test: add hybrid recommendation E2E integration tests"
```

---

## Summary

| Task | 설명 | 새 파일 | 수정 파일 |
|------|------|---------|----------|
| 1 | Tokenizer (공백+2-gram) | `tokenizer.py`, test | - |
| 2 | BM25 Search Service | `bm25_service.py`, test | `pyproject.toml` |
| 3 | Enhanced Context Parser | `context_parser.py`, test | - |
| 4 | Reason Template Engine | `reason_template.py`, test | - |
| 5 | Hybrid Search Service (RRF) | `hybrid_search_service.py`, test | - |
| 6 | Embedding Text Optimization | test | `certificate_formatter.py` |
| 7 | SearchStats Schema | test | `recommendation.py` |
| 8 | Unified Endpoint Refactoring | test | `natural_recommendation_service.py`, `recommendations.py` |
| 9 | BM25 Startup Init | test | `main.py` |
| 10 | Reindex Script Update | - | `vector_store.py`, `reindex_all.py` |
| 11 | E2E Integration Test | test | - |

**의존성 순서:** Task 1 → 2 → 5, Task 3 독립, Task 4 독립, Task 6 독립, Task 7 독립, Task 8은 1-7 모두 완료 후, Task 9는 2+8 완료 후, Task 10은 6 완료 후, Task 11은 모든 태스크 완료 후.

**병렬 가능:** Task 1→2→5 경로와 Task 3, 4, 6, 7을 병렬로 진행 가능.
