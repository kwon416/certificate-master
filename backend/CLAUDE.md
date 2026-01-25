# Backend - Certificate Master

## 🚀 최근 업데이트 (2026-01-13)

### Brave Search 학습 계획 컨텍스트 강화 (v3.0)

**1. 학습 계획 전용 검색 카테고리 추가**
- 시험 일정, 시험 구성/배점, 합격률, 평균 준비기간
- 합격 수기 기반 주차별 학습 계획
- 학습 순서, 시간 배분(이론/실전/복습), 취약 과목 전략
- 모의고사/기출문제 반복 학습, 공식 출처

**2. 검색 품질 강화**
- 카테고리별 키워드 힌트 기반 relevance 점수 추가
- URL 품질 + 최신성 + 키워드 매칭 점수로 정렬
- 공통 실행 로직(`_run_categorized_queries`)으로 확장성 확보

**3. 테스트 추가 (TDD)**
- `tests/unit/test_brave_search_service.py` 추가
- 키워드 힌트 정렬 검증
- 학습 계획 컨텍스트 검색 카테고리 호출 검증

---

## 🚀 최근 업데이트 (2026-01-09)

### LLM 기반 학습 계획 자동 생성 시스템 구축 (v7.0)

#### 주요 개선사항

**1. StudyPlanService 구현 (TDD 방식)**
- ✅ **LLM 기반 학습 계획 생성**
  - Certificate 정보 (overview, difficulty, study_period_days, study_guide 등) 분석
  - 사용자 입력 (target_date, daily_study_hours) 고려
  - GPT-4o-mini를 사용한 맞춤형 계획 생성
  - 주차별 마일스톤 (milestones) 및 학습 주제 (topics) 자동 생성

**2. Study Plans API 통합**
- ✅ **POST /api/v1/study-plans/** 수정
  - milestones 미제공 시 LLM 자동 생성
  - milestones 제공 시 수동 학습 계획 지원 (LLM 미호출)
  - Certificate 전체 데이터 조회 및 LLM에 전달
  - 생성된 계획을 데이터베이스에 저장

**3. 테스트 완료**
- ✅ **Unit 테스트**: 7/7 통과 (`test_study_plan_service.py`)
  - API 키 초기화 테스트
  - LLM 호출 성공 테스트
  - 에러 처리 테스트 (API 키 없음, 과거 날짜, 빈 응답)
  - LLM 호출 파라미터 검증 테스트

- ✅ **Integration 테스트**: 3/3 통과 (`test_study_plans_llm_api.py`)
  - LLM 기반 학습 계획 생성 E2E 테스트
  - 수동 milestones 제공 시 LLM 미호출 확인
  - LLM 오류 처리 테스트

#### LLM 프롬프트 설계

**System Prompt 핵심 요소**:
1. **자격증 정보 분석**:
   - 제목, 개요, 난이도, 권장 준비 기간
   - 시험 과목, 공식 일정 링크, 접수 기간
   - 학습 순서, 시간 배분 가이드, 추천 교재, 성공 팁

2. **사용자 입력 반영**:
   - 목표 완료일 (남은 일수 계산)
   - 하루 학습 시간
   - 총 학습 시간 = 하루 학습 시간 × 남은 일수

3. **학습 계획 생성 규칙**:
   - **주차 계산**: 남은 일수 / 7일
   - **주차별 마일스톤**: 각 주차마다 명확한 학습 목표 설정
     - 1주차: 기초 개념 이해
     - 중간 주차: 실전 문제 풀이
     - 마지막 주차: 모의고사 및 복습
   - **학습 주제**: 시험 과목과 학습 순서 기반 구체적 주제 생성
     - 각 주제는 특정 주차에 배정
     - 우선순위 설정 (high/medium/low)
   - **시간 배분**: 시간 배분 가이드 (theory/practice/review) 비율 적용
   - **현실성 검증**: 권장 준비 기간과 비교, 부족 시 경고
   - **구체성**: "기출문제 3회 풀이", "모의고사 2회" 같이 구체적으로

#### 생성 데이터 구조

**Milestone (주차별 마일스톤)**:
```json
{
  "week": 1,
  "title": "1주차: 기초 개념 학습",
  "description": "소프트웨어 설계 및 데이터베이스 기초 개념을 학습합니다. 교재 1-3장을 정독하고 핵심 개념을 정리합니다.",
  "hours": 14.0,
  "completed": false
}
```

**Topic (학습 주제)**:
```json
{
  "name": "소프트웨어 설계",
  "description": "소프트웨어 생명주기, UML 다이어그램 학습",
  "week": 1,
  "hours": 7.0,
  "priority": "high"
}
```

#### API 엔드포인트 변경사항

**POST /api/v1/study-plans/ (수정됨)**

**Request Body**:
```json
{
  "certificate_id": "uuid",
  "title": "정보처리기사 학습 계획",
  "target_date": "2026-06-30",
  "daily_study_hours": 2.0
  // milestones: 미제공 시 LLM 자동 생성
  // milestones: 제공 시 수동 학습 계획
}
```

**Response**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "certificate_id": "uuid",
  "title": "정보처리기사 학습 계획",
  "target_date": "2026-06-30",
  "daily_study_hours": 2.0,
  "topics": [
    {
      "name": "소프트웨어 설계",
      "description": "소프트웨어 생명주기, UML 다이어그램 학습",
      "week": 1,
      "hours": 7.0,
      "priority": "high"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "title": "1주차: 기초 개념 학습",
      "description": "소프트웨어 설계 및 데이터베이스 기초 개념을 학습합니다.",
      "hours": 14.0,
      "completed": false
    }
  ],
  "status": "active",
  "progress_percentage": 0.0,
  "created_at": "2026-01-09T10:00:00Z",
  "updated_at": "2026-01-09T10:00:00Z"
}
```

#### 파일 구조 (신규 추가)

```
backend/
├── app/
│   ├── services/
│   │   └── study_plan_service.py     # 새 서비스 (LLM 기반 학습 계획 생성)
│   └── api/v1/
│       └── study_plans.py             # LLM 통합 (수정됨)
└── tests/
    ├── unit/
    │   └── test_study_plan_service.py  # 새 Unit 테스트
    └── integration/
        └── test_study_plans_llm_api.py # 새 Integration 테스트
```

#### 핵심 인사이트

1. **맞춤형 학습 계획**
   - 자격증별 특성 (난이도, 과목, 준비 기간) 반영
   - 사용자 상황 (목표일, 학습 시간) 고려
   - LLM이 현실적이고 실행 가능한 계획 생성

2. **유연한 설계**
   - LLM 자동 생성 (milestones 미제공 시)
   - 수동 학습 계획 (milestones 제공 시)
   - 사용자 선택권 보장

3. **비용 효율성**
   - GPT-4o-mini 사용 (저비용)
   - 필요할 때만 LLM 호출
   - 평균 생성 비용: ~$0.01/계획

4. **데이터 기반 계획**
   - Certificate enrichment 데이터 활용
   - 학습 가이드 (study_guide) 기반 순서 제공
   - 시간 배분 가이드 (time_allocation) 비율 적용

---

## Architecture Overview

### Framework & Core Technologies
- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Async Queue**: Celery with Redis
- **Cache**: Redis
- **Vector Store**: Pinecone
- **AI/LLM**: OpenAI API (GPT-4, Embeddings)
- **Search**: Brave Search API

---

## Project Structure

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── v1/
│   │   │   ├── certificates.py  # Certificate CRUD & search
│   │   │   ├── study_plans.py   # Study plan management
│   │   │   ├── checkins.py      # Check-in tracking
│   │   │   └── auth.py          # Supabase auth integration
│   │   └── deps.py              # Dependency injection
│   ├── core/
│   │   ├── config.py            # Settings (Pydantic BaseSettings)
│   │   ├── supabase.py          # Supabase client initialization
│   │   └── security.py          # Auth middleware & helpers
│   ├── models/                  # SQLAlchemy models (minimal)
│   ├── schemas/                 # Pydantic schemas
│   ├── services/
│   │   ├── brave_search.py      # Brave API integration
│   │   ├── llm_service.py       # OpenAI integration
│   │   ├── embedding_service.py # Vector embeddings
│   │   └── vector_store.py      # Pinecone integration
│   └── main.py                  # FastAPI app entry point
├── data/                        # Data files (inside backend)
│   ├── raw/                    # Raw source data
│   │   └── credentials.csv     # Korean certificate data (CSV)
│   └── processed/              # Processed data outputs
│       ├── certificates_parsed.json
│       └── certificates_enriched.json
├── scripts/
│   ├── __init__.py
│   ├── parse_csv.py             # Parse certificate CSV
│   └── enrich_data.py           # Enrich with LLM data
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── __init__.py
│   │   └── test_parse_csv.py    # CSV parsing tests
│   ├── integration/
│   └── conftest.py
├── .env.example
├── pyproject.toml
└── Dockerfile
```

---

## Supabase Integration

### Client Initialization

**File**: `app/core/supabase.py`

```python
from supabase import create_client, Client
from functools import lru_cache
from .config import settings

@lru_cache()
def get_supabase_client() -> Client:
    """Create singleton Supabase client for backend services."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )

def get_supabase_user_client(access_token: str) -> Client:
    """Create Supabase client with user's access token."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )
    client.auth.set_session(access_token)
    return client
```

### Authentication Middleware

**File**: `app/core/security.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from .supabase import get_supabase_client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client)
):
    """Verify JWT token from Supabase Auth and return user."""
    try:
        user = supabase.auth.get_user(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
```

### Configuration

**File**: `app/core/config.py`

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_DB_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # External APIs
    BRAVE_API_KEY: str
    OPENAI_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX: str

    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

---

## Database Schema (Supabase)

### Tables

**Certificates Table**:
```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL,
    category VARCHAR(100) NOT NULL,
    series VARCHAR(200),
    title VARCHAR(300) NOT NULL,

    -- Enriched data
    overview TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    study_period_days INTEGER,
    recommended_lectures JSONB,
    exam_info JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(code, title)
);
```

**Study Plans Table**:
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_id UUID NOT NULL REFERENCES certificates(id),

    target_date DATE NOT NULL,
    daily_hours DECIMAL(3,1) DEFAULT 2.0,
    milestones JSONB NOT NULL,

    status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Check-ins Table**:
```sql
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours_studied DECIMAL(3,1) NOT NULL,
    notes TEXT,
    mood VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(study_plan_id, checkin_date)
);
```

---

## API Endpoints

### Certificates

**GET /api/v1/certificates/search**
```python
@router.get("/search")
async def search_certificates(
    q: str,
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """Search certificates using vector similarity."""
    pass
```

**GET /api/v1/certificates/{cert_id}**
```python
@router.get("/{cert_id}")
async def get_certificate(
    cert_id: str,
    current_user = Depends(get_current_user)
):
    """Get certificate details."""
    pass
```

### Study Plans

**POST /api/v1/study-plans**
```python
@router.post("/")
async def create_study_plan(
    plan: StudyPlanCreate,
    current_user = Depends(get_current_user)
):
    """Create AI-generated study plan."""
    pass
```

---

## Development Workflow

### Local Development
```bash
# Start Supabase (in separate terminal)
supabase start

# Install dependencies with uv
uv sync --extra dev

# Run development server
uv run uvicorn app.main:app --reload --port 8000

# Parse CSV data
uv run python -m scripts.parse_csv
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Run `supabase status -o env` to get Supabase keys
3. Fill in external API keys (Brave, OpenAI, Pinecone)

---

## Testing Strategy

### Unit Tests
- Service layer logic (LLM, embeddings, search)
- Data parsing scripts
- Target: 80% coverage

### Integration Tests
- Supabase database operations
- API endpoint responses
- Authentication flow

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/unit/test_parse_csv.py -v

# Run with coverage
uv run pytest --cov=scripts --cov-report=html
```

---

## Data Processing

### CSV Parsing

The `scripts/parse_csv.py` module parses the raw Korean certificate CSV data:

```bash
# Parse CSV and generate JSON
uv run python -m scripts.parse_csv
```

**Input**: `data/raw/credentials.csv`
**Output**: `data/processed/certificates_parsed.json`

**Schema**:
```python
{
    "code": str,        # 자격구분코드 (S, T, Q, etc.)
    "category": str,    # 자격구분명 (국가전문자격, 국가기술자격, etc.)
    "series": str,      # 계열명
    "title": str,       # 종목명
    "raw_id": str       # {code}_{title}
}
```

---

## Dependencies

Dependencies are managed via `pyproject.toml` with uv:

```bash
# Install all dependencies
uv sync --extra dev

# Add new dependency
uv add <package>

# Add dev dependency
uv add --dev <package>
```

---

## Key Differences from PostgreSQL

1. **No SQLAlchemy Sessions**: Use Supabase Python client
   - Instead of: `db.query(Certificate).filter(...)`
   - Use: `supabase.table('certificates').select('*').eq('id', cert_id).execute()`

2. **Built-in RLS**: Enable Row Level Security policies in Supabase

3. **Auth Integration**: No custom User model needed
   - User data in `auth.users` (managed by Supabase)

---

## 🚀 최근 업데이트 (2026-01-08)

### 학습 패턴 분석 시스템 구축 (v6.0)

#### 주요 개선사항

**1. LearningPattern API 구현**
- ✅ **LearningPatternService** 구현 (TDD 방식)
  - 시간대 분석 (`analyze_time_slots`) - 선호 학습 시간대 추출
  - 평균 세션 시간 계산 (`calculate_average_session_duration`)
  - 요일별 효율 분석 (`analyze_weekday_efficiency`)
  - 기분 추이 분석 (`analyze_mood_trend`)
  - 학습 일관성 점수 계산 (`calculate_consistency_score`)

- ✅ **Learning Pattern API** 구현
  - `GET /api/v1/analytics/learning-pattern/{study_plan_id}`: 학습 패턴 분석

**2. Analytics API Integration 테스트**
- ✅ **13개 E2E 테스트 작성** (`test_analytics_api.py`)
  - ProgressAnalytics API: 9개 테스트
    - 정상 조회, 체크인 없는 경우, 인증 실패
    - completion rate 계산 검증
    - 위험 신호 감지 (streak_broken)
    - learner status 분류
    - 추천 액션 제공
  - LearningPattern API: 4개 테스트 (구현 완료, 실행 대기)
    - 정상 조회, 인증 실패, 404 에러
    - 데이터 부족 시 처리

**3. LearningPatternService Unit 테스트**
- ✅ **22개 Unit 테스트 통과** (`test_learning_pattern_service.py`)
  - 시간대 분석: 5개 테스트
  - 평균 세션 시간: 3개 테스트
  - 요일별 효율: 3개 테스트
  - 기분 추이: 4개 테스트
  - 일관성 점수: 3개 테스트
  - 기타: 4개 테스트

#### 학습 패턴 분석 기능

| 분석 항목 | 계산 방식 | 활용 |
|----------|----------|------|
| **선호 시간대** | 체크인 생성 시간 분석 (오전/오후/저녁/새벽) | 최적 학습 시간 추천 |
| **평균 세션 시간** | `mean(hours_studied)` | 학습 강도 평가 |
| **요일별 효율** | 요일별 평균 학습 시간 비교 | 효율적 요일 강조 |
| **기분 추이** | 최근 7일 기분 점수 변화 추세 | 번아웃 예방 |
| **일관성 점수** | `변동계수(CV) = std / mean` 기반 | 학습 습관 평가 |

#### 일관성 점수 계산 (Consistency Score)

```
CV (변동계수) = 표준편차 / 평균

점수 산정:
- CV ≤ 0.3: 매우 일관적 (100 ~ 70점)
- 0.3 < CV ≤ 0.6: 보통 (70 ~ 40점)
- CV > 0.6: 일관성 낮음 (40 ~ 0점)
```

#### 테스트 현황
- ✅ **Unit 테스트**: 109/110 통과 (99.1%)
  - Analytics Service: 17개 ✅
  - LearningPattern Service: 22개 ✅
  - 기타: 70개 ✅

- ✅ **Integration 테스트**: 13개 작성 (인증 문제로 일부 skip)
  - Analytics API: 9개
  - LearningPattern API: 4개

- ✅ **전체 테스트**: 164개 수집

#### 파일 구조 (신규 추가)

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── analytics.py               # LearningPattern API 추가
│   │   └── progress_analytics.py      # Import 오류 수정
│   └── services/
│       └── learning_pattern_service.py  # 새 서비스
└── tests/
    ├── integration/
    │   ├── test_analytics_api.py      # 새 Integration 테스트
    │   └── test_health.py             # Indentation 수정
    └── unit/
        └── test_learning_pattern_service.py  # 새 Unit 테스트
```

#### API 엔드포인트 추가

**GET /api/v1/analytics/learning-pattern/{study_plan_id}**
```json
{
  "plan_id": "uuid",
  "preferred_time_slots": ["오전", "저녁"],
  "average_session_duration": 2.8,
  "best_weekday": "월요일",
  "worst_weekday": "금요일",
  "mood_trend": "improving",
  "recent_moods": ["good", "great", "good", "okay", "great"],
  "consistency_score": 85.5
}
```

#### 핵심 인사이트

1. **학습 패턴 가시화**
   - 학습자가 언제, 어떻게 공부하는지 데이터 기반 인사이트
   - "오전에 집중력이 가장 높아요" 같은 개인화된 피드백

2. **일관성의 중요성**
   - 일관적인 학습 시간 = 높은 완료율
   - 변동계수(CV)로 학습 습관 정량화

3. **번아웃 조기 감지**
   - 기분 추이 분석으로 번아웃 징후 포착
   - "최근 3일간 피곤하다고 응답 → 휴식 권장"

---

## 🚀 이전 업데이트 (2026-01-08)

### API 문서 한글화 및 학습 분석 시스템 구축 (v5.0)

#### 주요 개선사항

**1. API 문서 완전 한글화**
- ✅ 모든 API 엔드포인트 docstring 한글화
- ✅ Pydantic 스키마 Field description 한글화
- ✅ OpenAPI/Swagger 문서 한글 지원
- ✅ 대상 파일:
  - `certificates.py`: 8개 엔드포인트
  - `study_plans.py`: 5개 엔드포인트
  - `checkins.py`: 7개 엔드포인트

**2. 스키마 정규화**
- ✅ DB 컬럼명 통일: `study_hours` → `hours_studied`
- ✅ Mood 값 통일: `excellent/neutral` → `great/okay`
- ✅ 마이그레이션 SQL 작성 (001, 002)

**3. 복합 진행도 분석 시스템 구축**
- ✅ **AnalyticsService** 구현 (TDD 방식)
  - 진도율 계산 (`calculate_completion_rate`)
  - 시간 이행률 계산 (`calculate_time_adherence_rate`)
  - 일정 준수율 계산 (`calculate_schedule_adherence_rate`)
  - 완료일 예측 (`predict_completion_date`)
  - 이탈 위험 감지 (`detect_streak_broken`, `detect_time_decreased`, `detect_mood_deteriorated`)
  - 학습자 상태 분류 (`classify_learner_status`)
  - 추천 액션 생성 (`generate_recommendations`)

- ✅ **Analytics API** 구현
  - `GET /api/v1/analytics/progress/{study_plan_id}`: 복합 진행도 조회

**4. 새로운 스키마 추가**
- ✅ `analytics.py`: 학습 분석 전용 스키마
  - `ProgressAnalytics`: 복합 진행도 분석 결과
  - `LearnerStatus`: 학습자 상태 (초과/정상/주의/위험)
  - `RiskSignal`: 이탈 위험 신호
  - `ReviewUrgency`: 복습 긴급도

#### 복합 진행도 지표 설계

| 지표 | 계산 방식 | 용도 |
|------|----------|------|
| **진도율** | `완료 마일스톤 / 전체 마일스톤 * 100` | 기본 진행 상황 |
| **시간 이행률** | `실제 학습 시간 / 계획 시간 * 100` | 학습 강도 |
| **일정 준수율** | `현재 진도 / 예상 진도 * 100` | 목표 달성 가능성 |
| **학습 연속성** | `current_streak` (체크인 API) | 학습 습관 |
| **복습 필요도** | `경과일 / 적정 복습 주기` | 망각 방지 |

#### 학습자 상태 분류

| 상태 | 기준 | 액션 |
|------|------|------|
| 🔥 초과 달성 | 일정 준수율 > 120% | 격려, 번아웃 경고 |
| ✅ 정상 진행 | 80% ≤ 일정 준수율 ≤ 120% | 유지 격려 |
| ⚠️ 주의 필요 | 50% ≤ 일정 준수율 < 80% | 학습 시간 재조정 제안 |
| 🚨 이탈 위험 | 일정 준수율 < 50% 또는 연속성 = 0 | 긴급 개입 필요 |

#### 이탈 위험 조기 탐지 신호

| 신호 | 임계값 | 설명 |
|------|--------|------|
| **연속성 단절** | streak = 0 && 마지막 체크인 > 7일 | 학습 중단 |
| **시간 급감** | 최근 7일 평균 < 계획의 50% | 동기 하락 |
| **기분 악화** | 연속 3회 `tired` 또는 `stressed` | 번아웃 징후 |

#### 테스트 현황
- ✅ **Unit 테스트**: 17개 통과 (analytics_service)
  - 진도율 계산: 3개
  - 시간 이행률: 3개
  - 일정 준수율: 2개
  - 위험 감지: 3개
  - 상태 분류: 4개
  - 완료일 예측: 2개

#### 파일 구조 (신규 추가)

```
backend/
├── app/
│   ├── api/v1/
│   │   └── analytics.py               # 새 API
│   ├── schemas/
│   │   └── analytics.py               # 새 스키마
│   └── services/
│       └── analytics_service.py       # 새 서비스
├── scripts/
│   └── migrations/
│       ├── 001_rename_study_hours_to_hours_studied.sql
│       └── 002_fix_mood_values.sql
└── tests/
    └── unit/
        ├── test_checkin_schema.py
        └── test_analytics_service.py
```

#### API 엔드포인트 추가

**GET /api/v1/analytics/progress/{study_plan_id}**
```json
{
  "plan_id": "uuid",
  "completion_rate": 65.0,
  "time_adherence_rate": 85.0,
  "schedule_adherence_rate": 72.0,
  "current_streak": 5,
  "learning_pattern_score": 0.0,
  "review_urgency": "medium",
  "status": "on_track",
  "predicted_completion_date": "2026-03-15",
  "recommendations": [
    "계획대로 잘 진행 중입니다. 현재 페이스를 유지하세요!"
  ],
  "risk_signals": []
}
```

#### 핵심 인사이트

1. **단순 진도율의 한계 극복**
   - 50% 진도 ≠ "잘 하고 있다"
   - 실제: 예정보다 2주 늦음 + 연속성 0 = 이탈 위험
   - 해결: 복합 지표 (진도율 + 일정 준수율 + 연속성)

2. **학습자 행동 데이터의 가치**
   - 기분(mood) 추이 → 번아웃 조기 감지
   - 학습 시간 패턴 → 최적 시간대 추천
   - 체크인 빈도 → 이탈 위험 예측

3. **데이터 기반 의사결정**
   - 정량 분석: 통계적 지표 계산 (Python)
   - 예측: 완료일, 이탈 확률 (회귀 분석)
   - 추천: 학습자 상태 기반 맞춤형 액션

---

## 🚀 이전 업데이트 (2026-01-07)

### 검색 품질 개선 및 서비스 안정화 (v4.0)

#### 주요 개선사항

**1. Brave Search 결과 품질 개선**
- ✅ URL 품질 점수 기반 정렬
- ✅ 최신성 점수 반영
- ✅ 공식 사이트 우선 순위 적용

**2. Enrichment Service 안정화**
- ✅ 검색 결과 형식 통일 및 정리
- ✅ LLM 입력 컨텍스트 구성 개선
- ✅ 오류 발생 시 빈 결과 처리

**3. LLM Service 정확도 향상**
- ✅ 난이도 기준 개선 (1년 이상 준비기간 포함)
  - 5: 1년 이상 소요, 매우 높은 난이도, 장기 준비 필수
- ✅ 시험 정보/학습 가이드 추출 정확도 향상

**4. API 로깅 최적화**
- ✅ `study_plans.py` 불필요한 디버그 로그 제거
- ✅ 핵심 에러 처리만 유지

#### 난이도 기준 (개선됨)
```
1: 1-2주 소요, 누구나 쉽게 합격 가능
2: 1-2개월 소요, 기초 지식으로 합격 가능
3: 3-6개월 소요, 체계적 학습 필요
4: 6개월-1년 소요, 전문 지식 및 집중 학습 필요
5: 1년 이상 소요, 매우 높은 난이도, 장기 준비 필수
```

---

### 데이터베이스 스키마 동기화 완료 (v3.0)

#### 문제점
- 백엔드/프론트엔드 코드와 데이터베이스 스키마 불일치
- 코드: `daily_hours` / DB: `daily_study_hours`
- DB에 있는 `title`, `topics`, `progress_percentage` 필드가 코드에 누락

#### 해결 사항

**백엔드:**
- ✅ `study_plan.py` 스키마 수정
  - `daily_hours` → `daily_study_hours`
  - `title` 필드 추가 (필수)
  - `topics`, `progress_percentage` 필드 추가
- ✅ `study_plans.py` API 엔드포인트 수정
  - 생성 시 모든 필드 매핑
  - 업데이트 시 모든 필드 지원

**프론트엔드:**
- ✅ `types.ts` 타입 정의 수정
  - `Topic` 인터페이스 추가
  - `StudyPlan`, `StudyPlanCreate`, `StudyPlanUpdate` 수정
- ✅ `create-study-plan-form.tsx` 폼 수정
  - `title` 입력 필드 추가
  - `daily_hours` → `daily_study_hours` 변경
  - 기본값 설정 (title: "{자격증명} 학습 계획")

#### 최종 데이터베이스 스키마
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    certificate_id UUID NOT NULL,
    title VARCHAR NOT NULL,
    target_date DATE NOT NULL,
    daily_study_hours NUMERIC,
    status VARCHAR,
    progress_percentage NUMERIC,
    topics JSONB,
    milestones JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

---

### CORS 및 500 에러 수정 (v2.0)

#### 문제 1: CORS 설정
**증상:**
- `Access-Control-Allow-Origin` 헤더가 없다는 CORS 에러

**원인:**
- 개발 환경에서 `allow_origins=["*"]` (와일드카드) 사용
- 와일드카드 사용 시 `allow_credentials=False`로 설정됨
- 인증 헤더/쿠키를 사용하는 API 요청에서 CORS 에러 발생

**해결 방안 (`app/main.py`):**
```python
# CORS middleware
# Always use explicit origins from config to support credentials
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

#### 문제 2: Study Plans API 500 에러
**증상:**
- `POST /api/v1/study-plans/` 요청 시 500 Internal Server Error
- 실제 CORS 에러가 아니라 **500 에러가 먼저 발생**
- 500 에러로 인해 CORS 헤더가 응답에 포함되지 않아 브라우저가 CORS 에러로 표시

**원인:**
- `study_plans.py`의 `.single()` 메서드 사용
- `.single()`은 데이터가 없을 때 예외 발생 (PGRST116)
- 예외 처리되지 않아 500 에러 발생

**해결 방안 (`app/api/v1/study_plans.py`):**
```python
# Before (문제)
cert_response = (
    supabase.table("certificates")
    .select("id")
    .eq("id", plan_data.certificate_id)
    .single()  # 데이터 없으면 예외 발생!
    .execute()
)

# After (해결)
try:
    cert_response = (
        supabase.table("certificates")
        .select("id")
        .eq("id", plan_data.certificate_id)
        .execute()  # .single() 제거
    )
    
    if not cert_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate not found",
        )
except APIError as e:
    if "PGRST116" in str(e):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate not found",
        )
    raise
```

#### 핵심 학습 포인트
1. **CORS 에러의 진짜 원인 파악하기**
   - CORS 에러 = CORS 설정 문제 ❌
   - 실제로는 500 에러 → CORS 헤더 누락 → 브라우저가 CORS 에러로 표시 ✅

2. **Supabase `.single()` 메서드 주의**
   - 데이터 없을 때 예외 발생
   - 항상 try-except로 처리하거나 제거

3. **FastAPI 예외 처리 순서**
   - 비즈니스 로직 에러 → CORS 미들웨어 우회
   - 항상 예외를 적절히 처리해야 CORS 헤더 포함

#### 주요 변경사항
- ✅ 모든 환경에서 명시적인 origin 리스트 사용
- ✅ `allow_credentials=True` 항상 활성화
- ✅ Study Plans API에서 `.single()` 제거 및 예외 처리
- ✅ 500 에러 → 404 에러로 적절히 변환

---

## 🚀 이전 업데이트 (2026-01-06)

### TDD 방식 개발 완료

#### 2. DB Health Check 엔드포인트 추가
- **엔드포인트**: `GET /health/db`
- **기능**: Supabase 연결 상태 및 데이터 존재 여부 확인
- **응답 예시**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "has_data": true
  }
  ```

#### 3. 데이터베이스 초기화 도구
- **SQL 파일**: `scripts/init_database.sql`
  - 전체 테이블 생성 (certificates, study_plans, checkins)
  - RLS 정책 설정
  - 샘플 데이터 삽입
  - 스키마 캐시 갱신

- **Python 스크립트**: `scripts/init_database.py`
  - 자동화된 데이터베이스 초기화
  - Windows 호환성 (이모지 제거)
  - 에러 처리 및 상세 로깅

#### 4. 설정 가이드 문서
- **SETUP_GUIDE.md**: Supabase 설정 단계별 가이드
- **TROUBLESHOOTING.md**: 일반적인 문제 해결 방법
- **README.md**: 프로젝트 초기 설정 가이드

### E2E 테스트 현황

**테스트 파일**: `tests/e2e/test_api_endpoints.py`

#### 통과한 테스트 (4/12)
- ✅ Health endpoint (`/health`)
- ✅ Root endpoint (`/`)
- ✅ Health endpoint accessibility
- ✅ Root endpoint accessibility

#### 수정 필요 (8/12)
- 🔄 Certificates API endpoints (Supabase 테이블 생성 필요)
- 🔄 CORS headers (코드 수정 완료, 테스트 재실행 필요)

### ✅ 완료된 작업 (2026-01-06)

#### TDD 사이클 완료

**🔴 RED → 🟢 GREEN → 🔵 REFACTOR**

1. **테이블 생성** ✅
   - Supabase Dashboard에서 `init_database.sql` 실행
   - 3개 테이블 생성: certificates, study_plans, checkins
   - RLS 정책 설정 및 샘플 데이터 삽입

2. **DB 연결 확인** ✅
   ```json
   {"status": "healthy", "database": "connected", "has_data": true}
   ```

3. **코드 수정** ✅
   - 404 에러 처리 개선 (Supabase 예외 핸들링)
   - CORS 테스트 수정 (Cross-origin 헤더 추가)

4. **E2E 테스트 완료** ✅
   ```
   ✅ 12/12 테스트 통과 (100%)
   - Health endpoints: 2/2
   - Certificates API: 4/4
   - Error handling: 2/2
   - Endpoints accessibility: 4/4
   ```

#### 학습한 교훈

1. **Supabase PostgREST 제한사항**
   - `exec_sql` RPC 함수 미지원
   - `.single()` 메서드가 데이터 없을 때 예외 발생
   - 해결: try-except로 PGRST116 에러 처리

2. **CORS 동작 원리**
   - 같은 origin 요청에는 CORS 헤더 불필요
   - Cross-origin 요청에만 헤더 추가
   - 해결: 테스트에서 Origin 헤더 명시적 추가

3. **TDD의 실전 적용**
   - RED: 실패하는 테스트로 문제 정의
   - GREEN: 최소한의 수정으로 통과
   - REFACTOR: 코드 품질 개선

#### 다음 단계

1. **Unit 테스트 추가**
   - Service layer 테스트
   - Schema validation 테스트

2. **Integration 테스트 확장**
   - Study plans API
   - Checkins API
   - Authentication flow

3. **성능 최적화**
   - 쿼리 최적화
   - 캐싱 전략
   - Connection pooling

### 학습 포인트

#### TDD 사이클 적용
1. **RED**: 실패하는 테스트 작성 및 실행
2. **분석**: 근본 원인 파악 (Supabase 테이블 누락)
3. **GREEN**: 최소한의 코드로 테스트 통과
4. **REFACTOR**: 코드 정리 및 최적화

#### 문제 해결 과정
```
E2E 테스트 실패 (500 에러)
  ↓
DB Health Check 추가
  ↓
Supabase 연결 확인
  ↓
테이블 누락 발견
  ↓
SQL 스크립트 생성
  ↓
Supabase에서 실행
  ↓
테스트 재실행
```

---


## Certificate Enrichment System (Updated: 2026-01-06 18:00)

### 최신 개선사항 (v2.0)

#### 1. 가독성 향상 ✅
- **줄바꿈 자동 삽입**: 긴 텍스트 필드에 자동 줄바꿈
  - Overview, Job Prospects, User Reviews에 적용
  - 후처리 단계에서 자동 처리

#### 2. 공식 일정 링크 검증 ✅
- **공식 출처 우선**: q-net, .go.kr 등 일정 공지 공식 링크만 사용
- **최신 공지 확인**: 최근 공지 페이지로 연결되는지 검증
- **불확실하면 제외**: 비공식 일정 링크는 제외

#### 3. 응시 자격 검증 강화 ✅
- **공식 출처 우선**: q-net, .go.kr 등 공식 사이트만
- **불확실하면 빈 값**: 추측 금지

#### 4. 연봉 정보 정확도 향상 ✅
- **구체적 범위**: "연 3,000만원 ~ 5,000만원" 형식
- **공식 통계 기반**: 신뢰할 수 있는 출처만
- **불확실하면 null**: 추측 금지

### 데이터 구조 (MVP Phase 1 확장)

#### 현재 구현된 필드
1. **기본 정보**: overview (줄바꿈 포함), difficulty, study_period_days
2. **시험 정보**: exam_info (과목, 형식, 합격 기준, 비용)
3. **응시 자격**: eligibility (요건, 제한사항)
4. **진로 정보**: career_info (활용 분야, 관련 직업, 평균 연봉, 전망)
5. **사용자 후기**: user_reviews (후기 요약, 난이도 피드백, 학습 팁)
6. **추천 강의**: recommended_lectures (플랫폼, 제목, URL, 강사, 가격)
7. **공식 출처**: official_sources (공식 사이트, 관련 기관)

### Brave Search 개선 (v2.0)
- **8개 카테고리 검색**: 일반, 통계, 진로, 후기, 학습 방법, 교재, 강의, 공식
- **Rate Limiting**: 1.0초 (Free tier: 1 query/sec)
- **총 40개 결과**: 각 카테고리당 5개
- **키워드 강화**: 통계/교재 검색에 핵심 키워드 추가

### LLM Service 개선 (v2.0)
- **2-Phase Processing**:
  1. Phase 1: 데이터 추출 (Extraction)
  2. Phase 2: 데이터 정제 및 강화 (Refinement)
- **검증 강화**:
  - 응시 자격: 공식 출처만 사용
  - 연봉: 구체적 범위, 불확실하면 null
- **가독성 향상**: 줄바꿈 자동 삽입 (후처리)

### 테스트 결과 (v2.0)
- 단일 자격증: 8-10초 (7개 검색 + 2-Phase LLM + 후처리)
- Brave API 제약: 1 query/sec
- 배치: ~8초/자격증
- 전체 (3545개): ~8시간 (예상)
- 비용: ~$0.50 (OpenAI GPT-4o-mini)

### 배치 실행 커맨드
```bash
# 테스트
uv run python -m scripts.enrich_certificates --test

# 전체
uv run python -m scripts.enrich_certificates --all
```

---
