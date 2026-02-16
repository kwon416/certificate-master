# 추천 기능 리디자인

**날짜**: 2026-02-16
**상태**: 승인됨

## 문제

- 추천 결과에 유사하지만 다른 분야의 자격증이 포함됨 (예: IT 요청 시 전기/통신/기계 자격증 추천)
- 근본 원인: DB에 분야(domain) 분류가 없어서 벡터 검색이 전체 자격증을 대상으로 수행됨
- 후처리 리랭킹(키워드 부스팅/감점)으로 보정하려 했으나 효과 부족

## 성공 기준

- Top 3 추천 결과가 사용자가 선택한 분야에 정확히 해당하는 자격증

## 설계

### 1. 입력 플로우

**현재**: 위저드(5단계) 또는 자연어(텍스트박스) - 2가지 경로
**변경**: 분야 선택(1단계) + 자연어(1단계) - 1가지 경로

```
Step 1: 분야 선택 (카드 UI, 복수 선택 가능)
  [IT/소프트웨어] [전기/전자] [건설/건축] [기계/금속]
  [화학/환경] [금융/회계] [의료/보건] [안전/방재]
  [식품/농업] [디자인/미디어] [경영/사무] [기타]

Step 2: 자연어 입력 (10-1000자)
  예: "비전공자인데 3개월 안에 딸 수 있는 IT 자격증 추천해주세요"
```

### 2. 카테고리 매핑

DB에 분야 분류가 없으므로 새로 추가:

- MariaDB `certificates` 테이블에 `domain` 컬럼 추가 (VARCHAR, JSON 배열 문자열)
- ChromaDB 메타데이터에 `domain` 필드 추가
- 기존 616개 자격증을 자동 분류:
  - 1차: 제목(title) + 계열(series) + `job_market_info.preferred_industries` 기반 규칙 분류
  - 2차: 분류 불가한 것은 LLM으로 분류
  - 하나의 자격증이 여러 분야에 속할 수 있음

분야 목록 (10-12개):
```
IT/소프트웨어, 전기/전자, 건설/건축, 기계/금속,
화학/환경, 금융/회계, 의료/보건, 안전/방재,
식품/농업, 디자인/미디어, 경영/사무, 기타
```

### 3. 추천 파이프라인 (3단계)

```
현재 (5단계, LLM 3회):                    변경 (3단계, LLM 2회):
1. LLM 상황 구조화                         1. LLM 상황 구조화 + 쿼리 생성 (통합)
2. 하드 필터링                                ↓
3. LLM 쿼리 생성 + 벡터 검색              2. 도메인 필터(where) + 벡터 검색 + 소프트 필터
4. 하이브리드 점수화 + 리랭킹                  ↓
5. LLM 추천 이유 생성                     3. LLM 추천 이유 생성
```

#### Step 1: 상황 구조화 + 쿼리 생성 (LLM 1회)

현재 2회 호출(ContextExtractor + QueryGenerator)을 1회로 통합.

```python
# 입력: 사용자 선택 분야 + 자연어 텍스트
# 출력: StructuredContext + 검색 쿼리 (한 번에)
```

#### Step 2: 도메인 필터 + 벡터 검색 + 소프트 필터

핵심 변경: ChromaDB `where` 필터로 도메인 사전 필터링

```python
filter_dict = {"domain": {"$contains": selected_domain}}
results = vector_store.query_similar(
    query_embedding=embedding,
    top_k=20,
    filter_dict=filter_dict
)
```

하드 필터 → 소프트 필터로 전환:
- 비전공자: `self_study_possible is False` → 제외가 아닌 감점(-15)
- `self_study_possible is None` → 중립(0점)

#### Step 3: 추천 이유 생성 (LLM 1회)

기존 ReasonGeneratorService 유지, 배치 처리.

### 4. 점수 계산

```python
def calculate_score(similarity, cert, context):
    score = similarity * 70  # 벡터 유사도 70%

    # 비전공자 보너스/감점 (최대 10점)
    if context.major_background == "비전공자":
        if cert.self_study_possible:
            score += 10
        elif cert.self_study_possible is False:
            score -= 15

    # 재직자 보너스 (최대 10점)
    if context.employment_status == "재직 중":
        if cert.study_period_days <= context.max_study_period_days * 0.7:
            score += 10
        elif cert.study_period_days <= context.max_study_period_days:
            score += 5

    # 채용 시장 보너스 (최대 10점)
    if cert.job_posting_frequency in ["매우 많음", "많음"]:
        score += 10

    return min(100, int(score))
```

### 5. 삭제할 코드

| 파일 | 이유 |
|------|------|
| `services/study/reranker.py` | 도메인 필터가 대체 |
| `services/study/hybrid_search.py` | TF-IDF 하이브리드 검색 제거 |
| `services/study/adaptive_threshold.py` | 고정 임계값으로 변경 |
| `services/study/query_generator.py` | context_extractor와 통합 |
| `services/study/recommendation_service.py` | 위저드 기반 서비스 제거 |
| 위저드 프론트엔드 컴포넌트 | InteractionWizard 등 |

### 6. 유지 및 수정할 코드

| 파일 | 변경 내용 |
|------|----------|
| `services/study/natural_recommendation_service.py` | 3단계 파이프라인으로 리팩터링 |
| `services/llm/context_extractor.py` | 쿼리 생성 기능 통합 |
| `services/study/reason_generator.py` | 유지 |
| `services/embedding/vector_store.py` | domain 필터 활용 (이미 지원) |
| `utils/certificate_formatter.py` | domain 메타데이터 추가 |
| `schemas/recommendation.py` | 위저드 스키마 제거, 통합 스키마 |
| `api/v1/recommendations.py` | 엔드포인트 통합 |

### 7. 새로 추가할 코드

| 파일 | 설명 |
|------|------|
| `scripts/classify_domains.py` | 기존 616개 자격증 도메인 자동 분류 |
| DB 마이그레이션 | `certificates.domain` 컬럼 추가 |

### 8. API 변경

```
현재:
  POST /api/v1/recommendations/         (위저드)
  POST /api/v1/recommendations/natural   (자연어)

변경:
  POST /api/v1/recommendations/          (통합)

Request Body:
{
  "domains": ["IT/소프트웨어"],
  "user_input": "비전공자인데 3개월 안에..."
}
```

### 9. 프론트엔드 변경

삭제:
- InteractionWizard, WizardProgress, WizardStep, OptionCard, TimeSlider
- NaturalInput, NaturalResults

수정:
- `recommend-content.tsx` → 2단계 플로우로 재작성
- `recommend-store.ts` → 위저드 상태 제거, 통합 상태
- `recommendation-results.tsx` → 통합 결과 표시

새로:
- `DomainSelector.tsx` → 분야 선택 카드 그리드

### 10. 주요 트레이드오프

| 결정 | 장점 | 단점 |
|------|------|------|
| 분야 수동 선택 | 검색 정밀도 대폭 향상 | 사용자에게 1단계 추가 |
| 리랭커/하이브리드 제거 | 코드 단순화, 유지보수 용이 | 향후 정밀도 추가 조정 어려움 |
| LLM 2회로 감소 | 비용/속도 개선 | 구조화+쿼리 품질 약간 저하 가능 |
| 소프트 필터 전환 | 더 많은 결과 제공 | 부적합한 자격증 포함 가능 |
