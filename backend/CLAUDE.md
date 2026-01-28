# Backend - Certificate Master

자격증 정보 + 맞춤형 학습 플랜 + AI 가이드 플랫폼 백엔드

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | FastAPI (Python 3.11+) |
| Database | MariaDB, Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Vector Store | ChromaDB, Pinecone |
| AI/LLM | OpenAI API (GPT-4o-mini, text-embedding-3-small) |
| Search | SearXNG (메타 검색 엔진) |
| Cache | Redis |
| Task Queue | Celery |

---

## Project Structure

```
backend/
├── app/
│   ├── api/v1/                    # API 엔드포인트
│   │   ├── certificates.py        # 자격증 CRUD & 검색
│   │   ├── study_plans.py         # 학습 계획 관리
│   │   ├── checkins.py            # 체크인 트래킹
│   │   ├── analytics.py           # 학습 분석
│   │   ├── progress_analytics.py  # 진행도 분석
│   │   └── recommendations.py     # 추천 시스템
│   ├── core/
│   │   ├── config.py              # Settings (Pydantic)
│   │   ├── database.py            # MariaDB 연결
│   │   ├── supabase.py            # Supabase 클라이언트
│   │   └── security.py            # 인증 미들웨어
│   ├── models/                    # SQLAlchemy 모델
│   ├── schemas/                   # Pydantic 스키마
│   └── services/                  # 비즈니스 로직
│       ├── search/                # 검색 서비스
│       │   ├── protocol.py        # SearchServiceProtocol
│       │   ├── factory.py         # get_search_service()
│       │   ├── searxng_search.py  # SearXNG 구현
│       │   └── content_crawler.py # trafilatura 크롤러
│       ├── embedding/             # 임베딩 서비스
│       │   ├── protocol.py        # EmbeddingProtocol
│       │   ├── factory.py         # get_embedding_service()
│       │   ├── service.py         # OpenAI/Local 구현
│       │   └── vector_store.py    # 벡터 스토어
│       ├── llm/                   # LLM 서비스
│       │   ├── service.py         # LLM 호출
│       │   └── enrichment_service.py # 데이터 강화
│       ├── analytics/             # 분석 서비스
│       │   ├── analytics_service.py
│       │   ├── learning_pattern_service.py
│       │   └── velocity_calculator.py
│       └── study/                 # 학습 서비스
│           ├── study_plan_service.py
│           └── recommendation_service.py
├── data/
│   ├── raw/                       # 원본 데이터
│   └── processed/                 # 처리된 데이터
├── scripts/
│   ├── data_pipeline.py           # 데이터 파이프라인
│   ├── enrich_certificates.py     # 자격증 강화
│   └── migrations/                # DB 마이그레이션
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── .env.example
├── pyproject.toml
└── Dockerfile
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres

# MariaDB
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=your_user
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=certificate_master

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1024

# Search Provider (SearXNG)
SEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://localhost:8888
SEARXNG_TIMEOUT=30.0

# Embedding Provider (openai | local)
EMBEDDING_PROVIDER=openai

# Vector Store
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=certificate-master

# Redis
REDIS_URL=redis://localhost:6379/0

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5100
```

---

## Development Commands

```bash
# 의존성 설치
uv sync --extra dev

# 개발 서버 실행
uv run uvicorn app.main:app --reload --port 8000

# 테스트 실행
uv run pytest

# 테스트 (커버리지)
uv run pytest --cov=app --cov-report=html

# SearXNG 실행 (Docker)
docker run -d -p 8888:8080 searxng/searxng

# 데이터 강화 (테스트)
uv run python -m scripts.enrich_certificates --test

# 데이터 강화 (전체)
uv run python -m scripts.enrich_certificates --all
```

---

## API Endpoints

### Certificates
- `GET /api/v1/certificates/search` - 자격증 검색
- `GET /api/v1/certificates/autocomplete` - 자동완성
- `GET /api/v1/certificates/categories` - 카테고리 목록
- `GET /api/v1/certificates/{id}` - 자격증 상세

### Study Plans
- `GET /api/v1/study-plans` - 학습 계획 목록
- `POST /api/v1/study-plans` - 학습 계획 생성 (LLM 자동 생성)
- `GET /api/v1/study-plans/{id}` - 학습 계획 상세
- `PATCH /api/v1/study-plans/{id}` - 학습 계획 수정
- `DELETE /api/v1/study-plans/{id}` - 학습 계획 삭제

### Check-ins
- `GET /api/v1/checkins` - 체크인 목록
- `POST /api/v1/checkins` - 체크인 생성
- `GET /api/v1/checkins/{id}/stats` - 통계
- `GET /api/v1/checkins/{id}/streak` - 연속 학습일

### Analytics
- `GET /api/v1/analytics/progress/{study_plan_id}` - 진행도 분석
- `GET /api/v1/analytics/learning-pattern/{study_plan_id}` - 학습 패턴 분석

### Recommendations
- `POST /api/v1/recommendations` - AI 추천

---

## Core Services

### 1. Search Service (SearXNG)

SearXNG 메타 검색 엔진을 사용한 자격증 정보 검색:

```python
from app.services.search.factory import get_search_service

service = get_search_service()

# 자격증 종합 검색 (크롤링 포함)
results = await service.search_certificate_comprehensive("정보처리기사")
```

**검색 카테고리:**
| 카테고리 | 검색 목적 |
|---------|----------|
| `job_postings` | 채용공고 우대/필수 조건 |
| `public_sector` | 공무원/공기업 가산점 |
| `cost_breakdown` | 총 비용 (교재+인강+응시료) |
| `non_major_reviews` | 비전공자/직장인 합격기 |
| `free_resources` | 기출문제/무료 자료 |
| `comparison` | 유사 자격증 비교 |

**URL 품질 점수:**
- 공식 사이트 (q-net.or.kr, .go.kr): 100점
- 채용 사이트 (saramin, jobkorea, wanted): 95점
- 교육 플랫폼 (eduwill, hackers): 90점

### 2. Study Plan Service (LLM)

GPT-4o-mini 기반 맞춤형 학습 계획 자동 생성:

```python
from app.services.study.study_plan_service import StudyPlanService

service = StudyPlanService()

# LLM 기반 학습 계획 생성
plan = await service.generate_study_plan(
    certificate=certificate_data,
    target_date="2026-06-30",
    daily_study_hours=2.0
)
```

**생성 데이터:**
- 주차별 마일스톤 (milestones)
- 학습 주제 (topics)
- 시간 배분 권장

### 3. Analytics Service

복합 진행도 분석 및 학습 패턴 분석:

**진행도 지표:**
| 지표 | 계산 방식 |
|------|----------|
| 진도율 | `완료 마일스톤 / 전체 마일스톤 * 100` |
| 시간 이행률 | `실제 학습 시간 / 계획 시간 * 100` |
| 일정 준수율 | `현재 진도 / 예상 진도 * 100` |
| 일관성 점수 | `변동계수(CV) = std / mean` 기반 |

**학습자 상태 분류:**
| 상태 | 기준 |
|------|------|
| 초과 달성 | 일정 준수율 > 120% |
| 정상 진행 | 80% <= 일정 준수율 <= 120% |
| 주의 필요 | 50% <= 일정 준수율 < 80% |
| 이탈 위험 | 일정 준수율 < 50% |

---

## Database Schema

### study_plans
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

### checkins
```sql
CREATE TABLE checkins (
    id UUID PRIMARY KEY,
    study_plan_id UUID NOT NULL,
    user_id UUID NOT NULL,
    checkin_date DATE NOT NULL,
    hours_studied DECIMAL(3,1) NOT NULL,
    notes TEXT,
    mood VARCHAR(20),
    created_at TIMESTAMPTZ,
    UNIQUE(study_plan_id, checkin_date)
);
```

---

## Testing

```bash
# 전체 테스트
uv run pytest

# Unit 테스트만
uv run pytest tests/unit/ -v

# Integration 테스트만
uv run pytest tests/integration/ -v

# 특정 테스트 파일
uv run pytest tests/unit/test_searxng_search_service.py -v

# 커버리지 리포트
uv run pytest --cov=app --cov-report=html
```

---

## Code Style

- **Formatter**: Black
- **Linter**: Ruff
- **Type Hints**: 필수
- **Indent**: 4 spaces
- **Docstring**: 한글

---

## Troubleshooting

### CORS 에러
- 500 에러가 CORS 에러로 표시될 수 있음
- 실제 원인 확인: 서버 로그 확인

### Supabase `.single()` 주의
- 데이터 없을 때 예외 발생 (PGRST116)
- 항상 try-except로 처리하거나 `.execute()` 사용

### SearXNG 연결 실패
```bash
# SearXNG 상태 확인
curl http://localhost:8888/healthz

# Docker 재시작
docker restart searxng
```
