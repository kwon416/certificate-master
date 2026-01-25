# Pinecone 데이터 파이프라인 가이드

**작성일**: 2026-01-14
**버전**: 1.0
**상태**: ✅ 프로덕션 준비 완료

---

## 📋 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [실행 방법](#실행-방법)
4. [동작 원리](#동작-원리)
5. [데이터 흐름](#데이터-흐름)
6. [문제 해결](#문제-해결)

---

## 개요

### 목적

Supabase PostgreSQL에 저장된 자격증 정보를 **벡터 임베딩으로 변환**하여 Pinecone 벡터 데이터베이스에 적재합니다. 이를 통해 **의미 기반 유사도 검색**이 가능해집니다.

### 사용 사례

- **자격증 추천 시스템**: 사용자 관심사와 의미적으로 유사한 자격증 검색
- **RAG(Retrieval-Augmented Generation)**: LLM 기반 추천에 컨텍스트 제공
- **하이브리드 검색**: 키워드 검색 + 의미 검색 조합

### 핵심 기술 스택

| 기술 | 역할 | 모델/설정 |
|------|------|----------|
| **Supabase** | 자격증 원본 데이터 저장 | PostgreSQL |
| **OpenAI Embeddings** | 텍스트 → 벡터 변환 | `text-embedding-3-large` |
| **Pinecone** | 벡터 검색 엔진 | 3072차원, cosine similarity |

---

## 사전 준비

### 1. 환경 변수 설정

`.env` 파일에 다음 키가 설정되어 있어야 합니다:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=certificate-master-index
```

### 2. Pinecone 인덱스 생성

Pinecone 콘솔에서 다음 설정으로 인덱스를 생성하세요:

- **Index Name**: `certificate-master-index`
- **Dimensions**: `3072` (text-embedding-3-large 모델)
- **Metric**: `cosine`
- **Cloud**: Free tier 사용 가능

### 3. 자격증 데이터 보강 완료

Pinecone 업로드 전에 반드시 자격증 데이터가 **enriched** 되어야 합니다:

```bash
# 자격증 데이터 보강 (LLM으로 overview, career_info 등 생성)
uv run python -m scripts.enrich_certificates --test
```

**보강 완료 조건**: `certificates` 테이블의 `overview` 필드가 null이 아님

---

## 실행 방법

### 옵션 1: 테스트 모드 (권장 - 첫 실행 시)

처음 5개 자격증만 처리하여 파이프라인이 정상 작동하는지 확인:

```bash
cd backend
uv run python -m scripts.generate_embeddings --test
```

**예상 출력**:
```
======================================================================
임베딩 생성 파이프라인
======================================================================

[1/5] 서비스 초기화 중...
[2/5] Supabase에서 보강된 자격증 조회 중...
5개의 보강된 자격증을 찾았습니다.

[3/5] 임베딩 생성 중 (모델: text-embedding-3-large)...
차원: 3072

  배치 1/1 처리 중 (5개 자격증)...
    ✓ 임베딩 5개 생성 완료
    Pinecone 업로드 중...
    ✓ Pinecone에 5개 업로드 완료

======================================================================
요약
======================================================================
총 처리: 5
건너뜀: 0
성공률: 5/5 (100.0%)

[4/5] Pinecone 인덱스 검증 중...
  ✓ 조회 성공, 유사 자격증 5개 반환
  최상위 결과: 정보처리기사 (점수: 0.998)

[5/5] 완료! ✨
```

### 옵션 2: 특정 개수만 처리

```bash
# 100개만 처리
uv run python -m scripts.generate_embeddings --limit 100
```

### 옵션 3: 전체 자격증 처리 (프로덕션)

```bash
# 모든 보강 완료 자격증 처리
uv run python -m scripts.generate_embeddings --all
```

**예상 소요 시간**:
- 3,545개 자격증 기준: **약 15-20분**
- 100개 배치 처리
- OpenAI API 호출 제한: 분당 3,000 requests (Tier 1)

### 옵션 4: 증분 업데이트 (신규 자격증만)

이미 Pinecone에 업로드된 자격증은 건너뛰고 새로운 자격증만 추가:

```bash
uv run python -m scripts.generate_embeddings --all --skip-existing
```

**사용 시나리오**:
- 매일/매주 신규 자격증 추가 시
- 데이터 재보강 후 변경된 자격증만 업데이트

---

## 동작 원리

### 1단계: 서비스 초기화

```python
supabase = get_supabase_client()
embedding_service = EmbeddingService()
vector_store = VectorStoreService()
```

- **Supabase Client**: 자격증 데이터 조회
- **EmbeddingService**: OpenAI 임베딩 생성
- **VectorStoreService**: Pinecone 업로드

### 2단계: Supabase 데이터 조회

```sql
SELECT id, title, category, series, overview, difficulty,
       study_period_days, career_info, exam_info
FROM certificates
WHERE overview IS NOT NULL  -- 보강 완료 데이터만
LIMIT 100;
```

**조회 조건**:
- `overview` 필드가 null이 아님 → enrichment 완료
- 선택 필드만 조회 (불필요한 데이터 제외)

### 3단계: 텍스트 포맷 변환

자격증 데이터를 임베딩에 적합한 텍스트로 변환:

```python
def format_certificate_for_embedding(cert: dict) -> str:
    parts = [
        f"자격증: {cert.get('title', '')}",
        f"분류: {cert.get('category', '')}",
        f"계열: {cert.get('series', '')}",
        f"개요: {cert.get('overview', '')}",
        f"난이도: {cert.get('difficulty', 'N/A')}/5",
        f"준비기간: {cert.get('study_period_days', 'N/A')}일",
        f"활용분야: {', '.join(career['use_cases'])}",
        f"관련직업: {', '.join(career['related_jobs'])}",
        f"시험과목: {', '.join(exam['subjects'])}"
    ]
    return "\n".join(parts)
```

**예시 출력**:
```
자격증: 정보처리기사
분류: 국가기술자격
계열: 정보기술
개요: 소프트웨어 개발 및 데이터베이스 구축 능력을 검증하는 자격증
난이도: 3/5
준비기간: 90일
활용분야: IT 개발, 시스템 운영, 데이터 분석
관련직업: 소프트웨어 개발자, DBA, 시스템 엔지니어
시험과목: 소프트웨어 설계, 데이터베이스, 네트워크, 프로그래밍
```

### 4단계: OpenAI 임베딩 생성

```python
embeddings = await embedding_service.create_embeddings(texts)
```

**모델 정보**:
- 모델: `text-embedding-3-large`
- 차원: **3072** (높은 정확도)
- 배치 크기: 100개씩
- 비용: ~$0.13 per 1M tokens

**배치 처리 이유**:
- API 호출 횟수 감소 → 비용 절감
- 속도 향상 (병렬 처리)

### 5단계: Pinecone 업로드

```python
vectors = [
    (cert["id"], embedding, metadata)
    for cert, embedding in zip(batch, embeddings)
]

vector_store.upsert_certificates_batch(vectors)
```

**메타데이터 구조**:
```python
metadata = {
    "title": "정보처리기사",
    "category": "국가기술자격",
    "series": "정보기술",
    "difficulty": 3,
    "study_period_days": 90,
    "overview": "소프트웨어 개발 및 데이터베이스..." # 500자 제한
}
```

**Pinecone 제한사항**:
- 메타데이터 크기: 40KB 이하
- 해결: `overview` 필드를 500자로 truncate

### 6단계: 검증 (Verification)

첫 번째 자격증으로 유사도 검색을 수행하여 업로드가 정상적으로 되었는지 확인:

```python
query_embedding = await embedding_service.create_embedding(text)
results = vector_store.query_similar(query_embedding, top_k=5)
```

**검증 기준**:
- 조회 성공 여부
- 반환된 결과 개수
- 최상위 결과의 유사도 점수 (> 0.9)

---

## 데이터 흐름

```
┌─────────────────┐
│   Supabase      │
│  (PostgreSQL)   │
│                 │
│  certificates   │
│  - id           │
│  - title        │
│  - overview     │
│  - career_info  │
│  - exam_info    │
└────────┬────────┘
         │
         │ SQL Query
         │ (overview IS NOT NULL)
         ▼
┌─────────────────┐
│  Python Script  │
│  generate_      │
│  embeddings.py  │
└────────┬────────┘
         │
         │ format_certificate_for_embedding()
         ▼
┌─────────────────┐
│  Formatted Text │
│                 │
│  "자격증: ...   │
│   분류: ...     │
│   개요: ..."    │
└────────┬────────┘
         │
         │ OpenAI Embeddings API
         │ (text-embedding-3-large)
         ▼
┌─────────────────┐
│  Vector (3072d) │
│                 │
│  [0.023, -0.15, │
│   0.087, ...]   │
└────────┬────────┘
         │
         │ Batch Upload (100개씩)
         ▼
┌─────────────────┐
│   Pinecone      │
│  Vector Store   │
│                 │
│  Namespace:     │
│  "certificates" │
└─────────────────┘
```

---

## 메타데이터 설계

### Pinecone에 저장되는 데이터

| 필드 | 타입 | 설명 | 용도 |
|------|------|------|------|
| **id** | UUID | 자격증 고유 ID | Supabase와 동기화 |
| **values** | float[] | 임베딩 벡터 (3072차원) | 유사도 검색 |
| **metadata.title** | string | 자격증 제목 | 결과 표시 |
| **metadata.category** | string | 자격증 분류 | 필터링 |
| **metadata.series** | string | 계열명 | 필터링 |
| **metadata.difficulty** | int | 난이도 (1-5) | 필터링, 정렬 |
| **metadata.study_period_days** | int | 권장 준비 기간 | 필터링, 정렬 |
| **metadata.overview** | string | 개요 (500자) | 상세 정보 |

### 메타데이터 활용 예시

#### 필터링된 유사도 검색
```python
results = vector_store.query_similar(
    query_embedding,
    top_k=10,
    filter_dict={
        "difficulty": {"$lte": 3},  # 난이도 3 이하
        "category": {"$eq": "국가기술자격"}
    }
)
```

#### 추천 시스템 통합
```python
# 사용자 컨텍스트 → 임베딩 → 유사 자격증 검색
user_context = "IT 분야 취업 준비를 위한 실용적인 자격증"
query_embedding = await embedding_service.create_embedding(user_context)

similar_certs = vector_store.query_similar(
    query_embedding,
    top_k=20,
    filter_dict={"study_period_days": {"$lte": 180}}  # 6개월 이내
)
```

---

## 비용 및 성능

### OpenAI API 비용

**모델**: `text-embedding-3-large`
**가격**: $0.13 per 1M tokens

**예상 비용** (3,545개 자격증 기준):
- 평균 토큰/자격증: ~300 tokens
- 총 토큰: 3,545 × 300 = 1,063,500 tokens
- **총 비용**: ~$0.14

### Pinecone 비용

**Free Tier**:
- 1개 인덱스
- 100,000 벡터 저장
- 무제한 쿼리

**현재 사용량**: 3,545 벡터 (3.5% 사용)

### 성능 지표

| 메트릭 | 값 |
|--------|-----|
| 배치 크기 | 100개 |
| 평균 처리 시간/배치 | ~30초 |
| 전체 처리 시간 (3,545개) | 15-20분 |
| OpenAI API 호출 횟수 | ~36회 |
| Pinecone Upsert 횟수 | ~36회 |

---

## 문제 해결

### 문제 1: `overview IS NULL` - 자격증 없음

**증상**:
```
[오류] 보강된 자격증이 없습니다.
```

**원인**: 자격증 데이터가 enrichment되지 않음

**해결 방법**:
```bash
# 자격증 데이터 보강 먼저 실행
uv run python -m scripts.enrich_certificates --test
```

---

### 문제 2: OpenAI API 키 오류

**증상**:
```
openai.error.AuthenticationError: Invalid API key
```

**원인**: `.env` 파일의 `OPENAI_API_KEY`가 잘못됨

**해결 방법**:
1. OpenAI 콘솔에서 API 키 확인
2. `.env` 파일 업데이트:
   ```env
   OPENAI_API_KEY=sk-...
   ```

---

### 문제 3: Pinecone 인덱스 없음

**증상**:
```
pinecone.exceptions.NotFoundException: Index 'certificates' not found
```

**원인**: Pinecone 인덱스가 생성되지 않음

**해결 방법**:
1. Pinecone 콘솔 접속
2. 새 인덱스 생성:
   - Name: `certificates`
   - Dimensions: `3072`
   - Metric: `cosine`

---

### 문제 4: Rate Limit 초과

**증상**:
```
openai.error.RateLimitError: Rate limit reached
```

**원인**: OpenAI API 호출 제한 초과

**해결 방법**:
- 배치 크기 축소 (100 → 50)
- 재시도 로직 추가 (exponential backoff)
- OpenAI Tier 업그레이드 (Tier 1 → Tier 2)

---

### 문제 5: Pinecone 메타데이터 크기 초과

**증상**:
```
ValueError: Metadata size exceeds 40KB limit
```

**원인**: `overview` 필드가 너무 김

**해결 방법**:
코드에 이미 적용됨:
```python
"overview": (cert.get("overview", "") or "")[:500]  # 500자로 제한
```

---

## 모니터링 및 유지보수

### 일일 체크리스트

- [ ] Pinecone 벡터 수 확인: `vector_store.index.describe_index_stats()`
- [ ] OpenAI API 사용량 확인
- [ ] Supabase 자격증 수와 Pinecone 벡터 수 일치 확인

### 주간 작업

- [ ] 신규 자격증 증분 업로드:
  ```bash
  uv run python -m scripts.generate_embeddings --all --skip-existing
  ```

### 월간 작업

- [ ] 전체 데이터 재임베딩 (enrichment 업데이트 반영)
- [ ] Pinecone 인덱스 최적화

---

## 고급 활용

### 1. 커스텀 청크 전략 (Phase 2)

현재는 자격증당 1개 벡터만 생성하지만, Phase 2에서는 **5가지 청크**로 분할:

```python
chunks = [
    ("overview", cert.title + cert.overview),
    ("career", cert.title + cert.career_info),
    ("exam", cert.title + cert.exam_info),
    ("study", cert.title + cert.study_guide),
    ("review", cert.title + cert.user_reviews)
]

for chunk_type, text in chunks:
    embedding = await embedding_service.create_embedding(text)
    vector_store.upsert_certificate(
        cert_id=f"{cert.id}_{chunk_type}",
        embedding=embedding,
        metadata={...}
    )
```

**예상 벡터 수**: 3,545 × 5 = **17,725 벡터**

### 2. 하이브리드 검색 (Keyword + Vector)

```python
# Step 1: 키워드 검색 (Supabase Full-Text Search)
keyword_results = supabase.table("certificates") \
    .select("id") \
    .text_search("title", "정보처리") \
    .execute()

# Step 2: 벡터 검색 (Pinecone)
query_embedding = await embedding_service.create_embedding("IT 자격증")
vector_results = vector_store.query_similar(query_embedding, top_k=20)

# Step 3: 결과 병합 (Rank Fusion)
combined_results = merge_results(keyword_results, vector_results)
```

### 3. 재순위화 (Reranking)

```python
# Pinecone에서 상위 100개 가져오기
candidates = vector_store.query_similar(query_embedding, top_k=100)

# LLM으로 재순위화
reranked = await llm_service.rerank(
    query="직장인 퇴근 후 준비 가능한 IT 자격증",
    candidates=candidates
)

return reranked[:10]  # 최종 10개 반환
```

---

## 참고 자료

### 내부 문서
- [RAG 추천 시스템 계획](./RAG_RECOMMENDATION_PLAN.md)
- [백엔드 개발 가이드](../backend/CLAUDE.md)
- [벡터 스토어 서비스](../backend/app/services/vector_store.py)

### 외부 문서
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [text-embedding-3-large](https://platform.openai.com/docs/guides/embeddings/embedding-models)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2026-01-14
**다음 업데이트 예정**: Phase 2 청크 전략 적용 시
