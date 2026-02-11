# Certificate Master - Backend API

Certificate Master의 FastAPI 기반 백엔드 서버입니다.

## 🏗️ 기술 스택

- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **ORM**: Supabase Python Client
- **Package Manager**: uv (빠른 Python 패키지 관리자)

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── api/              # API 엔드포인트
│   │   ├── deps.py       # 의존성 주입
│   │   └── v1/          # API v1
│   │       ├── certificates.py  # 자격증 API
│   │       ├── study_plans.py   # 학습 계획 API
│   │       └── checkins.py      # 체크인 API
│   ├── core/            # 핵심 모듈
│   │   ├── config.py    # 설정
│   │   ├── supabase.py  # Supabase 클라이언트
│   │   └── security.py  # 인증/보안
│   ├── schemas/         # Pydantic 스키마
│   └── main.py         # FastAPI 앱 진입점
├── data/               # 데이터 파일
│   ├── raw/           # 원본 CSV
│   └── processed/     # 처리된 JSON
├── scripts/           # 유틸리티 스크립트
│   ├── parse_csv.py   # CSV 파싱
│   └── seed_certificates.py  # 데이터 시딩
├── tests/            # 테스트
├── .env             # 환경변수 (gitignore됨)
├── pyproject.toml   # 프로젝트 설정
└── README.md        # 이 파일
```

## 🚀 빠른 시작

### 1. 사전 요구사항

- **Python 3.11+** 설치
- **uv** 패키지 관리자 설치:
  ```bash
  # Windows (PowerShell)
  powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
  
  # macOS/Linux
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

### 2. 프로젝트 클론 및 이동

```bash
cd backend
```

### 3. 의존성 설치

```bash
# 개발 의존성 포함 설치
uv sync --extra dev
```

### 4. 환경변수 설정

**중요**: `.env` 파일을 생성하고 Supabase 정보를 입력하세요.

#### 4.1 `.env` 파일 생성

`backend/.env` 파일을 생성합니다:

```bash
# backend/.env
SUPABASE_URL=https://ztszcaynrcghexgbkmoc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGp3enhmc3BmcmJtaW91Y2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTc5MjMsImV4cCI6MjA4MzE5MzkyM30.VCLO3XiTcBK6tCxeObGqfMP4Geq1gMhVbRXgRSKCwgM
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드에서 확인>

# Optional (나중에 추가)
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=certificate-master

# Application Settings
ENVIRONMENT=development
DEBUG=true
```

#### 4.2 Service Role Key 찾기

1. Supabase 대시보드 접속: https://supabase.com/dashboard/project/ztszcaynrcghexgbkmoc/settings/api
2. **Project API keys** 섹션에서 `service_role` 키 복사
3. `.env` 파일의 `SUPABASE_SERVICE_ROLE_KEY`에 붙여넣기

⚠️ **주의**: `service_role` 키는 절대 공개 저장소에 커밋하지 마세요!

### 5. 데이터베이스 확인

Supabase 테이블이 이미 생성되어 있는지 확인:

```bash
# Supabase Studio에서 확인
# https://supabase.com/dashboard/project/ztszcaynrcghexgbkmoc/editor
```

**생성된 테이블**:
- `certificates` - 자격증 정보
- `study_plans` - 사용자 학습 계획
- `checkins` - 학습 체크인 기록

### 6. 초기 데이터 시딩

자격증 데이터를 Supabase에 업로드합니다:

```bash
# 테스트용 100개만 업로드
uv run python -m scripts.seed_certificates --limit 100

# 전체 데이터 업로드 (~24,000개 까지)
uv run python -m scripts.seed_certificates

# 기존 데이터 삭제 후 재업로드
uv run python -m scripts.seed_certificates --clear
```

### 7. 서버 실행

```bash
# 개발 서버 실행 (Hot reload)
uv run uvicorn app.main:app --reload --port 8000
```

서버가 정상적으로 실행되면:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...]
```

### 8. API 문서 확인

브라우저에서 다음 URL에 접속:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📖 API 엔드포인트

### 자격증 (Certificates)

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/api/v1/certificates/search` | 선택 | 자격증 검색 (키워드, 카테고리, 코드) |
| GET | `/api/v1/certificates/categories` | 없음 | 카테고리 목록 조회 |
| GET | `/api/v1/certificates/{id}` | 선택 | 자격증 상세 조회 (UUID) |
| GET | `/api/v1/certificates/raw/{raw_id}` | 선택 | 자격증 상세 조회 (raw_id) |
| PATCH | `/api/v1/certificates/{id}` | 서비스 | 자격증 정보 업데이트 |

### 학습 계획 (Study Plans)

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/api/v1/study-plans/` | 필수 | 내 학습 계획 목록 |
| POST | `/api/v1/study-plans/` | 필수 | 학습 계획 생성 |
| GET | `/api/v1/study-plans/{id}` | 필수 | 학습 계획 상세 |
| PATCH | `/api/v1/study-plans/{id}` | 필수 | 학습 계획 수정 |
| DELETE | `/api/v1/study-plans/{id}` | 필수 | 학습 계획 삭제 |

PATCH 동작 참고:
- `milestones` 업데이트 시 `progress_percentage`가 비어 있으면 마일스톤 완료 비율로 자동 계산됩니다.
- `progress_percentage`가 100 이상이면 `status`가 `completed`로 자동 업데이트됩니다.

### 체크인 (Checkins)

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/api/v1/checkins/` | 필수 | 내 체크인 목록 |
| POST | `/api/v1/checkins/` | 필수 | 체크인 생성 |
| GET | `/api/v1/checkins/stats` | 필수 | 체크인 통계 (총 시간, 연속 일수) |
| GET | `/api/v1/checkins/{id}` | 필수 | 체크인 상세 |
| PATCH | `/api/v1/checkins/{id}` | 필수 | 체크인 수정 |
| DELETE | `/api/v1/checkins/{id}` | 필수 | 체크인 삭제 |

## 🧪 테스트

테스트 실행은 **항상 `uv run`** 으로 수행합니다. 자세한 규칙은 `CODEX_TESTING.md`를 참고하세요.

```bash
# 모든 테스트 실행
uv run pytest

# Unit 테스트만 실행
uv run pytest tests/unit

# E2E 테스트 실행 (서버 실행 필요, API_BASE_URL 옵션)
# 예: API_BASE_URL=http://localhost:8000 uv run pytest tests/e2e
uv run pytest tests/e2e

# 특정 테스트 실행
uv run pytest tests/unit/test_parse_csv.py -v

# 커버리지와 함께 실행
uv run pytest --cov=app --cov-report=html
```

## 🔍 개발 도구

### 코드 포맷팅

```bash
# Black으로 포맷팅
uv run black app/ scripts/ tests/

# Ruff로 린트 체크
uv run ruff check app/ scripts/ tests/

# Ruff로 자동 수정
uv run ruff check --fix app/ scripts/ tests/
```

### 타입 체크

```bash
# mypy로 타입 체크 (옵션)
uv run mypy app/
```

## 🐛 문제 해결

### 1. `uv` 명령어를 찾을 수 없음

```bash
# uv 재설치
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# PATH 확인 및 재시작
```

### 2. Supabase 연결 오류

```bash
# .env 파일 확인
cat .env  # Linux/Mac
type .env  # Windows

# 환경변수가 제대로 로드되는지 확인
uv run python -c "from app.core.config import get_settings; print(get_settings().SUPABASE_URL)"
```

### 3. 데이터 시딩 실패

```bash
# 1. Supabase 테이블이 존재하는지 확인
# 2. Service Role Key가 올바른지 확인
# 3. JSON 파일이 존재하는지 확인
ls data/processed/certificates_parsed.json
```

### 4. 포트 충돌 (8000번 포트 사용 중)

```bash
# 다른 포트로 실행
uv run uvicorn app.main:app --reload --port 8001
```

### 5. 의존성 설치 오류

```bash
# uv 캐시 정리 및 재설치
uv cache clean
uv sync --extra dev --reinstall
```

## 📚 추가 문서

- **전체 프로젝트 가이드**: [../CLAUDE.md](../CLAUDE.md)
- **백엔드 아키텍처**: [./CLAUDE.md](./CLAUDE.md)
- **API 문서**: http://localhost:8000/docs (서버 실행 후)
- **Study Plan API 가이드**: [./STUDY_PLAN_API_GUIDE.md](./STUDY_PLAN_API_GUIDE.md) - 프론트엔드 연동
- **Study Plan 테스트 가이드**: [./STUDY_PLAN_TEST_GUIDE.md](./STUDY_PLAN_TEST_GUIDE.md)

## 🔐 인증 흐름

### 인증이 필요한 엔드포인트 호출

```bash
# 1. Supabase에서 로그인 (프론트엔드 또는 Supabase Auth API)
# 2. JWT 토큰 받기
# 3. Authorization 헤더에 토큰 추가

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/api/v1/study-plans/
```

### 테스트용 사용자 생성

Supabase Studio에서 직접 사용자 생성:
1. https://supabase.com/dashboard/project/ztszcaynrcghexgbkmoc/auth/users
2. "Add user" 클릭
3. 이메일/비밀번호 입력

## 🚀 배포

### Docker로 실행 (예정)

```bash
# Dockerfile 빌드
docker build -t certificate-master-backend .

# 컨테이너 실행
docker run -p 8000:8000 --env-file .env certificate-master-backend
```

## 🤝 기여

1. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
2. 변경사항 커밋 (`git commit -m 'feat: Add amazing feature'`)
3. 브랜치 푸시 (`git push origin feature/amazing-feature`)
4. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🤖 Certificate Enrichment (Updated 2026-01-06)

자격증 데이터를 AI로 강화하는 시스템이 구현되어 있습니다.

### 데이터 구조 (MVP Phase 1)

사용자 우선순위 기반으로 설계되었습니다:

1. **시험 정보** - 과목, 형식, 합격 기준, 응시료
2. **난이도 & 준비기간** - 얼마나 어렵고 얼마나 걸리나
3. **추천 강의** - 어떻게 공부하나 (정확한 URL 포함)
4. **합격률** (Phase 2)
5. **취업 정보** (Phase 2)

### 생성되는 데이터

**기본 정보**:
- `overview`: 3-5문장 개요 (줄바꿈 포함, 가독성 향상)
- `difficulty`: 난이도 1-5
- `study_period_days`: 준비기간 (일)
- `exam_info`: 시험 과목, 형식, 합격 기준, 응시료

**응시 자격**:
- `eligibility`: 응시 요건, 제한사항 (공식 출처 검증)

**진로 정보**:
- `career_info`: 활용 분야, 관련 직업, 평균 연봉 (범위), 직업 전망

**사용자 후기**:
- `user_reviews`: 실제 합격자 후기 요약, 난이도 피드백, 학습 팁

**추천 강의**:
- `recommended_lectures`: 강의 목록 (플랫폼, 제목, URL, 강사, 가격)

**공식 출처**:
- `official_sources`: 공식 사이트, 관련 기관 URL

### Quick Start

```bash
# 1. 환경 변수 추가 (.env 파일)
OPENAI_API_KEY=your_openai_api_key

# 2. 자격증 데이터 seed (처음 한 번만)
uv run python -m scripts.seed_certificates

# 3. 1개 자격증 enrichment 테스트
uv run python -m scripts.enrich_certificates --test

# 4. 소규모 배치 (10개)
uv run python -m scripts.enrich_certificates --limit 10

# 5. 전체 enrichment (3545개, ~3시간, ~$0.30)
uv run python -m scripts.enrich_certificates --all
```

### 처리 성능

- 단일: 8-10초 (7개 카테고리 검색 + 2-Phase LLM + 후처리)
- 배치 처리: ~8초/자격증
- 전체 (3545개): ~8시간 (예상)
- 비용: ~$0.50 (OpenAI GPT-5-nano)

### 상세 가이드

- 데이터 구조 설계: [DATA_STRUCTURE_DESIGN.md](./DATA_STRUCTURE_DESIGN.md)
- Enrichment 프로세스: [ENRICHMENT_GUIDE.md](./ENRICHMENT_GUIDE.md)
- 전체 개발 문서: [CLAUDE.md](./CLAUDE.md)

## 👥 개발자

Certificate Master Team

---

**문제가 있나요?** [이슈](https://github.com/your-repo/issues)를 등록해주세요!

