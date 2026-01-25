# 자격증 추천 RAG 시스템 구현 계획

**버전**: 1.1
**작성일**: 2026-01-13
**최종 수정**: 2026-01-14
**상태**: ✅ Phase 1.5 데이터 기반 개선 완료

---

## 🔥 최신 업데이트 (2026-01-14)

### 데이터 분석 기반 인터랙션 재설계

실제 자격증 데이터(3,545개) 분석 결과를 바탕으로 인터랙션 흐름을 재설계했습니다:

**주요 변경사항**:
1. **자격구분명 기반 분류**: 데이터 키 그대로 질문/필터링 (필요 시 일학습병행자격 제외 옵션)
2. **Step 1 재설계**: 임의 분야 → **자격구분명 기반 선택** (일학습병행자격/국가기술자격/과정평가형자격/국가전문자격)
3. **Step 2 재설계**: 분야 → **계열명 기반 선택** (데이터 키 직접 활용)
4. **Step 3 재설계**: 5개 상태 → **4개 경험 수준** (처음 시작, 관련 전공, 실무 경험, 하위 자격증 보유)
5. **FIELD_MAPPING**: 자격구분명 + 계열명으로 직접 필터링 (패턴 매핑 최소화)

**기술적 개선**:
- `primary_field` → `qualification_type` + `series_name` (자격구분명/계열명 직접 사용)
- `user_status` → `experience_level` (경험 중심)
- 계열(series) 기반 스코어링 추가
- 백엔드 테스트 16개 전체 통과 ✅

**데이터 분포 (자격구분명)**:
| 자격구분명 | 개수 |
|------------|------|
| 일학습병행자격 | 2,729 |
| 국가기술자격 | 495 |
| 과정평가형자격 | 217 |
| 국가전문자격 | 104 |

---

## 📋 목차

1. [개요](#개요)
2. [핵심 결정사항](#핵심-결정사항)
3. [단계별 개발 계획](#단계별-개발-계획)
4. [구현 상태](#구현-상태)
5. [API 설계](#api-설계)
6. [파일 구조](#파일-구조)
7. [UI/UX 가이드](#uiux-가이드)
8. [성공 지표](#성공-지표)

---

## 개요

### 미션 스테이트먼트

> **"사용자와의 대화를 통해 맥락을 이해하고, AI가 최적의 자격증을 추천하여 의사결정 시간을 90% 줄인다."**

### 배경

기존 자격증 검색 방식의 문제점:
- **정보 과부하**: 3,545개의 자격증 중 무엇을 선택해야 할지 모름
- **컨텍스트 부재**: 검색 키워드만으로는 개인 상황을 반영하기 어려움
- **낮은 전환율**: 검색 → 상세보기 전환율 15%, 학습계획 생성률 5%

### 솔루션

**인터랙션 기반 RAG 추천 시스템**:
1. 5단계 위자드로 사용자 컨텍스트 수집 (관심분야, 목표, 상태, 시간, 기간)
2. 벡터 검색으로 의미론적 매칭
3. LLM으로 개인화된 추천 이유 생성
4. 실현 가능성(feasibility) 검증

---

## 핵심 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| **페이지 구조** | 탭 전환 (`/search` 내 추천/검색 탭) | 기존 UX 유지하면서 새 기능 제공 |
| **인터랙션 방식** | 카드 선택 | 시각적으로 명확, 모바일 친화적 |
| **MVP 접근** | Phase 1: 규칙 기반 먼저 | UI/UX 검증 후 RAG 적용 |
| **벡터 DB** | Pinecone 유지 | 이미 구축됨, 마이그레이션 리스크 회피 |
| **LLM** | GPT-4o-mini | 비용 효율적, 빠른 응답 |

---

## 단계별 개발 계획

### Phase 1: MVP - 인터랙션 + 규칙 기반 추천 (2주) ✅ 백엔드 완료

#### 목표
- 인터랙션 위자드 UI 구현
- 규칙 기반 필터링으로 추천
- 탭 전환 UI 구현

#### 인터랙션 흐름 (5 Steps) - **2026-01-14 업데이트됨**

```
Step 1: 자격 구분 선택 (데이터 키 기반)
  "어떤 종류의 자격증을 찾고 계신가요?"
  [국가전문자격] [국가기술자격] [과정평가형자격] [일학습병행자격]
  → Signal: qualification_type (자격구분명)

Step 2: 계열 선택 (데이터 키 기반)
  "어떤 계열의 자격증을 원하시나요?"
  [계열 리스트] 또는 [모르겠어요/전체]
  → Signal: series_name (계열명)

Step 3: 경험 수준 (재설계)
  "관련 분야 경험이 어느 정도 있으세요?"
  [처음 시작] [관련 전공 있음] [실무 경험 있음] [하위 자격증 보유]
  → Signal: experience_level (RAG 검색 최적화)

Step 4: 목표
  "자격증을 왜 취득하려고 하세요?"
  [취업 준비] [이직/커리어 전환] [승진/연봉] [자기 계발] [창업 준비]
  → Signal: goal_type (변경 없음)

Step 5: 학습 시간/기간
  "하루에 몇 시간 공부할 수 있나요? 그리고 언제까지 취득하고 싶으세요?"
  [슬라이더: 0.5 ~ 6시간] + [1개월 이내/3개월/6개월/1년/정하지 않음]
  → Signal: daily_study_hours, target_timeline (변경 없음)
```

#### 분야별 매핑 전략

| 입력 | 데이터 키 | 필터링 방식 |
|------|----------|-------------|
| 자격 구분 | 자격구분명 | 정확 일치 |
| 계열 | 계열명 | 정확 일치 (모르겠어요/전체는 스킵) |

#### 규칙 기반 추천 로직

```python
async def get_recommendations(ctx: RecommendationRequest) -> list[Certificate]:
    """Phase 1: 규칙 기반 필터링"""

    query = supabase.from_("certificates").select("*")

    # 1. 자격 구분 필터 (자격구분명)
    if ctx.qualification_type:
        query = query.eq("qualification_type", ctx.qualification_type)

    # 2. 계열 필터 (계열명)
    if ctx.series_name:
        query = query.eq("series", ctx.series_name)

    # 3. 난이도 필터 (목표 기간 기준)
    difficulty_mapping = {
        "1개월 이내": 2,
        "3개월 이내": 3,
        "6개월 이내": 4,
        "1년 이내": 5,
    }
    if ctx.target_timeline in difficulty_mapping:
        query = query.lte("difficulty", difficulty_mapping[ctx.target_timeline])

    # 4. 준비 기간 필터
    max_days = calculate_max_study_days(ctx.daily_study_hours, ctx.target_timeline)
    if max_days:
        query = query.lte("study_period_days", max_days)

    # 5. 정렬 및 반환
    result = query.order("difficulty").limit(10).execute()
    return result.data
```

---

### Phase 2: 벡터 검색 적용 (2주)

#### 목표
- 자격증 데이터 벡터화
- Pinecone 인덱스 생성 (새 namespace)
- 벡터 검색으로 추천 품질 향상

#### 청크 전략 (5 Types)

| Chunk Type | 포함 데이터 | 목적 |
|------------|------------|------|
| Overview | title + category + overview + difficulty | 일반 매칭 |
| Career | title + career_info (직업, 연봉, 전망) | 목표 기반 매칭 |
| Exam | title + exam_info (과목, 형식, 기준) | 기술 매칭 |
| Study | title + study_guide (방법, 순서, 시간) | 실현 가능성 매칭 |
| Review | title + user_reviews (후기, 팁) | 실제 경험 매칭 |

**예상 벡터 수**: 3,545 x 5 = ~17,725 vectors

#### 쿼리 변환 로직

```python
def generate_rag_query(ctx: RecommendationRequest) -> str:
    """사용자 컨텍스트를 의미론적 쿼리로 변환"""

    parts = []
    if ctx.qualification_type:
        parts.append(ctx.qualification_type)
    if ctx.series_name:
        parts.append(ctx.series_name)
    parts.append("자격증")

    goal_mapping = {
        "취업 준비": "취업에 도움되는 실용적인",
        "이직/커리어 전환": "경력 전환에 유리한 전문",
        "승진/연봉 협상": "직장 내 인정받는 고급",
    }
    parts.append(goal_mapping.get(ctx.goal_type, ""))

    experience_mapping = {
        "처음 시작": "입문자도 준비 가능한",
        "관련 전공 있음": "전공자에게 유리한",
        "실무 경험 있음": "실무 경험에 도움이 되는",
        "하위 자격증 보유": "상위 단계로 이어지는",
    }
    parts.append(experience_mapping.get(ctx.experience_level, ""))

    return " ".join(filter(None, parts)) + " 자격증 추천"
```

---

### Phase 3: RAG 품질 개선 (2주)

#### 목표
- LLM 기반 추천 이유 생성
- Reranking 로직 추가
- Hybrid Search (벡터 + 키워드)

#### 추천 이유 생성

```python
async def generate_recommendation_reasons(
    certificates: list[Certificate],
    ctx: RecommendationRequest
) -> list[str]:
    """LLM으로 개인화된 추천 이유 생성"""

    prompt = f"""
사용자 맥락:
- 자격 구분: {ctx.qualification_type}
- 계열: {ctx.series_name}
- 목표: {ctx.goal_type}
- 경험 수준: {ctx.experience_level}
- 하루 학습 시간: {ctx.daily_study_hours}시간

각 자격증에 대해 "왜 이 자격증인가?"를 2-3문장으로 설명:
1. 사용자 목표와의 연관성
2. 준비 가능성 (시간 대비)
3. 실질적 이점
"""

    response = await llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[...],
        response_format={"type": "json_object"}
    )
    return parse_reasons(response)
```

---

### Phase 4: 피드백 반영 + 개인화 (2주)

#### 목표
- 사용자 피드백 수집 (thumbs up/down)
- 추천 히스토리 저장
- 로그인 사용자 개인화

#### 데이터베이스 스키마

```sql
-- 추천 피드백
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  certificate_id UUID REFERENCES certificates(id),
  feedback_type VARCHAR(10),  -- 'positive' | 'negative'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 히스토리
CREATE TABLE recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  context JSONB,              -- 사용자 컨텍스트 스냅샷
  recommendations JSONB,      -- 추천 결과
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 구현 상태

### ✅ 완료 (2026-01-14)

**Backend**:
- [x] `app/schemas/recommendation.py` - Pydantic 스키마 (RecommendationRequest, RecommendedCertificate, RecommendationResponse, Feasibility)
- [x] `app/services/recommendation_service.py` - 규칙 기반 추천 로직
- [x] `app/api/v1/recommendations.py` - POST /api/v1/recommendations/ 엔드포인트
- [x] 백엔드 테스트 16개 전체 통과 (스키마 13개 + API 3개)

**Frontend**:
- [x] `tests/e2e/recommend.spec.ts` - E2E 테스트 작성 (RED phase)

### 🚧 진행 중

**Frontend** (TDD 방식으로 진행):
- [ ] `components/recommend/search-tabs.tsx` - 추천/검색 탭
- [ ] `components/recommend/interaction-wizard.tsx` - 위자드 컨테이너
- [ ] `components/recommend/wizard-step.tsx` - 각 질문 단계
- [ ] `components/recommend/option-card.tsx` - 선택지 카드
- [ ] `components/recommend/time-slider.tsx` - 시간 슬라이더
- [ ] `components/recommend/recommendation-results.tsx` - 결과 컨테이너
- [ ] `components/recommend/recommendation-card.tsx` - 추천 카드
- [ ] `stores/recommend-store.ts` - Zustand 상태 관리
- [ ] `hooks/use-recommendations.ts` - TanStack Query 훅
- [ ] `app/search/page.tsx` - 탭 UI 통합

### ⏳ 예정

**Phase 2**:
- [ ] 벡터화 스크립트 (`scripts/vectorize_certificates.py`)
- [ ] Pinecone 새 namespace 설정
- [ ] 벡터 검색 통합

**Phase 3**:
- [ ] LLM 추천 이유 생성
- [ ] Reranking 로직

**Phase 4**:
- [ ] 피드백 수집 UI/API
- [ ] 추천 히스토리 저장

---

## API 설계

### POST /api/v1/recommendations/

#### Request

```typescript
interface RecommendationRequest {
  qualification_type: string // "국가기술자격", "국가전문자격", etc.
  series_name?: string       // "세무사", "국내여행안내사", etc.
  goal_type: string          // "취업 준비", "이직/커리어 전환", etc.
  experience_level: string   // "처음 시작", "관련 전공 있음", etc.
  daily_study_hours: number  // 0.5 ~ 12.0 시간
  target_timeline: string    // "3개월 이내", etc.
}
```

**예시**:
```json
{
  "qualification_type": "국가기술자격",
  "series_name": "정보처리",
  "goal_type": "취업 준비",
  "experience_level": "처음 시작",
  "daily_study_hours": 2.0,
  "target_timeline": "3개월 이내"
}
```

#### Response

```typescript
interface RecommendationResponse {
  recommendations: RecommendedCertificate[]
  query_summary: string      // "국가기술자격(정보처리) 취업 준비를 위한..."
  total_matched: number
}

interface RecommendedCertificate {
  certificate: Certificate
  match_score: number        // 0-100
  recommendation_reason: string
  key_points: string[]       // 핵심 포인트 3개
  feasibility: {
    can_prepare: boolean
    estimated_days: number
  }
}
```

**예시**:
```json
{
  "recommendations": [
    {
      "certificate": {
        "id": "...",
        "title": "정보처리기사",
        "category": "국가기술자격",
        "difficulty": 3,
        "study_period_days": 90
      },
      "match_score": 95,
      "recommendation_reason": "국가기술자격(정보처리) 취업 준비에 가장 실용적인 자격증입니다. 하루 2시간씩 3개월간 준비 가능합니다.",
      "key_points": [
        "기업 채용 우대 자격증",
        "실무 중심 출제",
        "온라인 학습 자료 풍부"
      ],
      "feasibility": {
        "can_prepare": true,
        "estimated_days": 90
      }
    }
  ],
  "query_summary": "국가기술자격(정보처리) 취업 준비를 위한 자격증 추천 (하루 2시간, 3개월)",
  "total_matched": 15
}
```

---

## 파일 구조

### Frontend (신규/수정)

```
frontend/src/
├── app/
│   └── search/
│       └── page.tsx                     # MODIFY: 탭 UI 추가
├── components/
│   └── recommend/                       # NEW: 전체 폴더
│       ├── index.ts
│       ├── search-tabs.tsx              # 추천/검색 탭 전환
│       ├── interaction-wizard.tsx       # 질문 위자드 컨테이너
│       ├── wizard-step.tsx              # 각 질문 단계 UI
│       ├── wizard-progress.tsx          # 진행 표시기
│       ├── option-card.tsx              # 선택지 카드
│       ├── time-slider.tsx              # 시간 슬라이더
│       ├── recommendation-results.tsx   # 결과 컨테이너
│       ├── recommendation-card.tsx      # 추천 카드
│       ├── match-score-badge.tsx        # 적합도 배지
│       ├── why-this-section.tsx         # 추천 이유 (확장 가능)
│       ├── alternatives-list.tsx        # 대안 목록
│       └── feedback-collector.tsx       # 피드백 수집
├── hooks/
│   └── use-recommendations.ts           # NEW: 추천 API 훅
├── stores/
│   └── recommend-store.ts               # NEW: Zustand 스토어
└── lib/api/
    └── recommendations.ts               # NEW: API 클라이언트
```

### Backend (신규/수정)

```
backend/
├── app/
│   ├── api/v1/
│   │   └── recommendations.py           # ✅ NEW: 추천 API 엔드포인트
│   ├── schemas/
│   │   └── recommendation.py            # ✅ NEW: Pydantic 스키마
│   └── services/
│       ├── recommendation_service.py    # ✅ NEW: 추천 오케스트레이션
│       ├── embedding_service.py         # MODIFY: RAG 청크 생성 추가
│       └── vector_store.py              # MODIFY: 새 namespace 지원
├── scripts/
│   └── vectorize_certificates.py        # NEW: 벡터화 배치 스크립트
└── tests/
    ├── unit/
    │   └── test_recommendation_schema.py  # ✅ NEW: 스키마 테스트 13개
    └── integration/
        └── test_recommendation_api.py     # ✅ NEW: API 테스트 3개
```

---

## UI/UX 가이드

### 옵션 카드 스타일

**선택 전**:
```tsx
<div className="p-4 border border-slate-700 rounded-xl
               hover:border-emerald-500 hover:bg-slate-800/50
               cursor-pointer transition-all">
  <span className="text-lg font-medium">{label}</span>
</div>
```

**선택 후**:
```tsx
<div className="p-4 border-2 border-emerald-500 rounded-xl
               bg-emerald-500/10">
  <span className="text-lg font-medium text-emerald-400">{label}</span>
  <CheckIcon className="text-emerald-400" />
</div>
```

### 추천 카드 구조

```
┌─────────────────────────────────────────┐
│ [95% 매치]                    [💚 좋아요] │
│                                         │
│ 정보처리기사                             │
│ 국가기술자격 · 정보기술                  │
│                                         │
│ ⭐⭐⭐ 난이도 · 📅 3개월 · 📈 45% 합격률 │
│                                         │
│ 💡 하루 2시간씩 준비 가능하며,            │
│    국가기술자격(정보처리) 취업에 실질적 도움이 됩니다.  │
│                                         │
│ [자세히 보기 ▼]                         │
│                                         │
│ [상세 정보]        [학습 계획 만들기]    │
└─────────────────────────────────────────┘
```

### 위자드 진행 표시기

```
Step 1/5: 관심 분야 선택

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 성공 지표

| 지표 | 현재 | Phase 1 목표 | 최종 목표 |
|------|------|--------------|----------|
| 검색→상세 전환율 | 15% | 25% | 40% |
| 학습계획 생성률 | 5% | 10% | 20% |
| 추천 만족도 | N/A | 70%+ | 80%+ |
| 평균 세션 시간 | 2분 | 3분 | 5분 |
| 추천 API 응답 시간 | N/A | < 2초 | < 1초 |

### 측정 방법

1. **전환율**: Google Analytics 이벤트 트래킹
2. **만족도**: 추천 카드 thumbs up/down
3. **응답 시간**: 백엔드 로깅
4. **세션 시간**: GA4 세션 길이

---

## 리스크 및 대응

| 리스크 | 대응 방안 |
|--------|----------|
| 규칙 기반 추천 품질 낮음 | Phase 2에서 벡터 검색으로 보완 |
| 위자드 이탈 | 스킵 옵션 제공, 진행률 표시 |
| Enriched 데이터 부족 | 기본 정보만으로도 추천 가능하게 설계 |
| LLM 응답 지연 | 스트리밍 표시, 캐싱 적용 |
| Pinecone 비용 증가 | 인덱스 크기 모니터링, 청크 최적화 |

---

## 검증 체크리스트

### Phase 1 완료 조건

- [x] 백엔드 API 구현 완료
- [x] 백엔드 테스트 16개 통과
- [ ] 위자드 5단계 모두 동작
- [ ] 규칙 기반 추천 10개 이상 반환
- [ ] 추천 결과 카드 정상 표시
- [ ] 탭 전환 (추천/검색) 동작
- [ ] 모바일 반응형 UI
- [ ] E2E 테스트 전체 통과

### 수동 테스트 시나리오

1. **국가기술자격 입문 케이스**:
   - 국가기술자격 + 정보처리 + 취업 준비 + 처음 시작 + 2시간/일 + 3개월
   - **예상 결과**: 정보처리기사, 리눅스마스터 등

2. **국가전문자격 전환 케이스**:
   - 국가전문자격 + 세무사 + 이직/커리어 전환 + 관련 전공 있음 + 1시간/일 + 6개월
   - **예상 결과**: 세무사 관련 자격증

3. **과정평가형 단기 케이스**:
   - 과정평가형자격 + (계열 전체) + 자기계발 + 처음 시작 + 4시간/일 + 1개월
   - **예상 결과**: 과정평가형 대상 종목 일부

---

## 참고 자료

### 관련 문서
- [프로젝트 계획](./cert-plan.md) - 전체 MVP 계획
- [백엔드 가이드](../backend/CLAUDE.md) - 백엔드 개발 가이드
- [프론트엔드 가이드](../frontend/CLAUDE.md) - 프론트엔드 개발 가이드

### 기술 스택
- **Backend**: FastAPI, Supabase PostgreSQL, Pinecone
- **Frontend**: Next.js 14, shadcn/ui, Zustand, TanStack Query
- **Testing**: Pytest (백엔드), Playwright (프론트엔드)

---

**작성자**: Claude Sonnet 4.5
**승인자**: [사용자명]
**다음 리뷰**: Phase 1 완료 시
