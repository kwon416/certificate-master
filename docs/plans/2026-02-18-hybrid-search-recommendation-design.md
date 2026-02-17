# 추천 시스템 하이브리드 검색 개선 설계

**날짜**: 2026-02-18
**목표**: LLM 호출 제거 + Dense+Sparse 하이브리드 검색으로 속도 10-20배 개선 및 검색 정확도 향상

## 1. 아키텍처 개요

### 현재 파이프라인 (문제점)
```
사용자 입력 → [LLM context 추출 ~20s] → [임베딩 생성] → [ChromaDB Dense 검색]
→ [후처리/필터링] → [LLM 이유 생성 ~20s] → 결과 반환
총 소요: ~40-60초
```

### 개선 파이프라인
```
사용자 입력 → [키워드 파싱 <1ms] → 병렬 실행:
  ├── [임베딩 생성 ~200ms] → [ChromaDB Dense 검색 ~100ms]
  └── [BM25 Sparse 검색 ~50ms]
→ [RRF 결합 <1ms] → [후처리/스코어링] → [템플릿 이유 생성 <1ms] → 결과 반환
총 소요: ~1-2초
```

### 핵심 변화
1. **LLM 호출 2건 완전 제거** → 키워드 파싱 + 템플릿으로 대체
2. **BM25 검색 추가** → Dense와 병렬 실행
3. **RRF로 결과 결합** → 키워드 정확성 + 의미 유사성 모두 확보
4. **3개 엔드포인트를 unified 하나로 통합**

---

## 2. BM25 Sparse 검색 구현

### 서비스 구조
```python
# 새 파일: app/services/search/bm25_service.py
class BM25SearchService:
    """자격증 텍스트에 대한 BM25 키워드 기반 검색"""
    _index: BM25Okapi          # rank-bm25 라이브러리
    _cert_ids: list[str]       # 인덱스 순서와 매핑
    _tokenized_corpus: list[list[str]]
```

### 토큰화 전략
- **방식**: 공백 분할 + character 2-gram
- **이유**: 자격증명은 대부분 명사 조합이라 형태소 분석 없이 충분
- **의존성**: `rank-bm25` (경량 Python 패키지)

### 인덱스 생명주기
- 앱 시작 시: MariaDB에서 자격증 데이터 로드 → BM25 인덱스 빌드 (인메모리)
- 자격증 추가/수정 시: 인덱스 리빌드

### 검색용 텍스트
```python
# 각 자격증의 BM25 인덱스 텍스트
text = f"{title} {categories} {series} {industry} {related_jobs} {overview_short}"
```

---

## 3. RRF (Reciprocal Rank Fusion) 결합

### 공식
```
RRF_score(d) = Σ 1 / (k + rank_i(d))
- k: 60 (표준값)
- rank_i(d): i번째 검색에서 문서 d의 순위 (1-based)
```

### 구현
```python
# 새 파일: app/services/search/hybrid_search_service.py
class HybridSearchService:
    RRF_K = 60

    async def search(self, query: str, domains: list[str], top_k: int = 10):
        # 1. Dense + Sparse 병렬 실행
        dense_results, sparse_results = await asyncio.gather(
            self.vector_store.search_records(query, top_k=top_k*3),
            self.bm25_service.search(query, domains=domains, top_k=top_k*3),
        )

        # 2. RRF 결합 (가중치 1:1)
        rrf_scores = {}
        for rank, result in enumerate(dense_results, 1):
            rrf_scores[result.id] = 1 / (self.RRF_K + rank)
        for rank, result in enumerate(sparse_results, 1):
            rrf_scores.setdefault(result.id, 0)
            rrf_scores[result.id] += 1 / (self.RRF_K + rank)

        # 3. 정렬 후 top_k 반환
        return sorted(rrf_scores.items(), key=lambda x: -x[1])[:top_k]
```

### 가중치
- 기본: Dense 1.0 : Sparse 1.0 (균등)
- 추후 튜닝: 쿼리 길이에 따라 동적 조정 가능

---

## 4. LLM 제거 및 대체

### 4-1. 키워드 파싱 개선: 4단계 규칙 기반 NLU

```python
# 개선: app/services/search/context_parser.py
class EnhancedContextParser:
    """4단계 파이프라인으로 사용자 컨텍스트 추출"""

    # 1단계: 정규식 패턴 매칭 (목표, 고용상태, 전공 등)
    GOAL_PATTERNS = {
        "employment": [r"취업|취직|입사|신입|공채|면접", r"졸업\s*(후|예정|하고)"],
        "career_change": [r"이직|전직|경력\s*전환"],
        "career_strength": [r"승진|연봉|경력\s*개발|스펙"],
        "self_development": [r"자기\s*계발|취미|관심|배우고"],
        "business": [r"창업|사업|프리랜서|독립"],
    }

    # 2단계: 동시 출현어 분석 (맥락 파악)
    COOCCURRENCE_RULES = [
        ({"비전공", "취업"}, {"major": "non_major", "goal": "employment"}),
        ({"직장인", "주말"}, {"employment": "employed", "time_constraint": "weekend"}),
    ]

    # 3단계: 수치 추출 (시간, 기간)
    TIME_PATTERNS = [
        (r"하루\s*(\d+)\s*시간", lambda m: int(m.group(1)) * 7),
        (r"주\s*(\d+)\s*시간", lambda m: int(m.group(1))),
        (r"(\d+)\s*개월", lambda m: int(m.group(1)) * 30),
    ]

    # 4단계: 도메인 자동 추론
    DOMAIN_KEYWORDS = {
        "IT/소프트웨어": ["정보처리", "네트워크", "보안", "프로그래밍", "컴퓨터", "IT"],
        "건설/안전": ["건축", "토목", "안전", "소방", "전기", "설비"],
        # ... 12개 도메인 전체
    }
```

**개선점**: 디폴트 값은 추론 실패 시에만 적용, 도메인 자동 추론 지원

### 4-2. 템플릿 이유 생성: 데이터 기반 동적 템플릿

```python
# 개선: app/services/search/reason_template.py
class ReasonTemplateEngine:
    """자격증 메타데이터의 실제 강점을 분석하여 이유 조합"""

    STRENGTH_ANALYZERS = [
        JobMarketStrength,      # 채용 시장 수요
        SalaryStrength,         # 연봉 프리미엄
        PassRateStrength,       # 합격률
        NonMajorStrength,       # 비전공자 접근성
        WorkerFriendlyStrength, # 직장인 접근성
        CostEfficiency,         # 비용 대비 가치
        PublicSectorStrength,   # 공공부문 가산점
    ]

    def generate(self, cert, context) -> str:
        """상위 3개 강점을 문장으로 조합"""
        strengths = self._analyze_strengths(cert, context)
        top_3 = sorted(strengths, key=lambda s: s.score, reverse=True)[:3]
        return " ".join(s.to_sentence(cert, context) for s in top_3)
```

**개선점**:
- MD5 해시 랜덤 → 데이터 기반 강점 분석
- 고정 템플릿 → 메타데이터 실제 값 활용
- 사용자 목적에 따라 강점 우선순위 동적 조정

---

## 5. 임베딩 텍스트 최적화

### 검색 최적화 텍스트 분리

```python
def format_search_text(cert: dict) -> str:
    """검색 최적화용 압축 텍스트 (임베딩용)"""
    parts = [
        cert["title"],
        cert.get("categories", ""),
        cert.get("series", ""),
        cert.get("career_info", {}).get("industry", ""),
        cert.get("career_info", {}).get("related_jobs", ""),
        cert.get("overview", "")[:200],
        cert.get("job_market_info", {}).get("preferred_industries", ""),
    ]
    return " ".join(filter(None, parts))
```

**효과**:
- 임베딩 벡터가 핵심 의미에 집중 → 검색 정확도 향상
- 짧은 쿼리와 긴 텍스트 간 길이 불균형 완화
- 임베딩 API 비용 절감

**주의**: 변경 후 ChromaDB 재인덱싱 필요 (`reindex_all.py`)

---

## 6. 엔드포인트 통합 및 스코어링

### 통합 엔드포인트

```python
# POST /api/v1/recommendations/unified (유일한 활성 엔드포인트)
class UnifiedRecommendationRequest(BaseModel):
    domains: list[str] = []     # 선택적 (자동 추론 가능)
    user_input: str             # 5-1000자
    top_k: int = 10

class UnifiedRecommendationResponse(BaseModel):
    recommendations: list[RecommendedCertificate]
    parsed_context: StructuredUserContext
    query_used: str
    search_stats: SearchStats

class SearchStats(BaseModel):
    dense_count: int
    sparse_count: int
    merged_count: int
    elapsed_ms: float
```

### 통합 스코어링

```python
def calculate_score(rrf_rank: int, cert, context) -> int:
    """RRF 순위 기반 + 컨텍스트 매칭 보너스"""
    base = max(0, 70 - (rrf_rank - 1) * 7)  # 1등=70 ~ 10등=7

    bonus = 0  # 최대 30점
    if context.goal == "employment" and cert.job_market.demand == "high":
        bonus += 10
    if context.major == "non_major" and cert.feasibility.self_study_possible:
        bonus += 10
    if context.employment == "employed" and cert.feasibility.working_adult_friendly:
        bonus += 10

    return min(100, base + bonus)
```

### 기존 엔드포인트
- `/recommendations` (wizard) → deprecated
- `/recommendations/natural` → deprecated
- `/recommendations/unified` → 유일한 활성 엔드포인트

---

## 7. 파일 구조 변경

### 새 파일
```
backend/app/services/search/
├── __init__.py
├── bm25_service.py          # BM25 Sparse 검색
├── hybrid_search_service.py # Dense+Sparse RRF 결합
├── context_parser.py        # 개선된 키워드 파싱 (4단계)
├── reason_template.py       # 데이터 기반 동적 템플릿
└── tokenizer.py             # 공백+2-gram 토큰화
```

### 수정 파일
```
backend/app/services/embedding/
├── certificate_formatter.py  # format_search_text() 추가
└── vector_store.py           # 변경 없음

backend/app/api/v1/
└── recommendations.py        # unified 엔드포인트 리팩토링, 나머지 deprecated

backend/app/schemas/
└── recommendation.py         # SearchStats, 응답 스키마 추가
```

### 의존성 추가
```toml
# pyproject.toml
[project.dependencies]
rank-bm25 = ">=0.2"
```

---

## 8. 예상 성능

| 항목 | 현재 | 개선 후 |
|------|------|--------|
| 총 소요 시간 | 40-60초 | 1-2초 |
| LLM API 호출 | 2회/요청 | 0회/요청 |
| LLM API 비용 | ~$0.01/요청 | $0 |
| 검색 정확도 | Dense만 | Dense+Sparse (RRF) |
| 키워드 쿼리 성능 | 약함 | BM25로 강화 |

---

## 9. 리스크 및 완화

| 리스크 | 완화 방안 |
|--------|----------|
| BM25 인메모리 인덱스 메모리 사용 | 자격증 수 ~1000개 수준이므로 <10MB |
| 템플릿 이유의 품질 | 7개 강점 분석기 + 데이터 기반 동적 선택으로 다양성 확보 |
| 키워드 파싱 오류 | 디폴트 값 적용 + 도메인 자동 추론으로 안전망 |
| 재인덱싱 필요 | reindex_all.py 스크립트 활용 |
| 기존 API 호환성 | deprecated 표시 후 점진적 제거 |
