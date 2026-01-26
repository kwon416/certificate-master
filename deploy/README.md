# Certificate Master - 배포 가이드

## ⚠️ 파일 위치 변경 안내

배포 관련 파일들이 각 프로젝트 디렉토리로 이동되었습니다.

### 새로운 파일 위치

| 기존 위치 | 새 위치 |
|----------|--------|
| `deploy/Dockerfile.backend` | `backend/Dockerfile` |
| `deploy/Dockerfile.frontend` | `frontend/Dockerfile` |
| `deploy/deploy-backend.sh` | `backend/deploy.sh` |
| `deploy/deploy-frontend.sh` | `frontend/deploy.sh` |
| `deploy/docker-compose.backend.yml` | `backend/docker-compose.yml` |
| `deploy/ecosystem.config.js` | `frontend/ecosystem.config.js` |

---

## 배포 정보
- **도메인**: https://dev-cert.i-ve.ai
- **환경**: Development
- **프론트엔드 포트**: 5100
- **백엔드 포트**: 8000

## 배포 방법

### Backend 배포 (Docker)

```bash
cd backend
./deploy.sh
```

### Frontend 배포 (PM2)

```bash
cd frontend
./deploy.sh
```

## 서비스 구조

```
        [외부 Nginx]
             │
             ▼ dev-cert.i-ve.ai (HTTPS)
    ┌────────────────────┐
    │  Frontend (Next.js)│
    │      :5100         │
    │  (rewrites로 프록시)│
    └─────────┬──────────┘
              │ /api/*, /docs, /health
              ▼
    ┌────────────────────┐
    │  Backend (FastAPI) │
    │      :8000         │
    └─────────┬──────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
  ┌─────────┐  ┌──────────┐
  │ MariaDB │  │ ChromaDB │
  │ (기존)  │  │ (기존)   │
  └─────────┘  └──────────┘
```

## 환경 변수

### Backend (.env)

| 변수 | 설명 | 예시 |
|------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `MARIADB_HOST` | MariaDB 호스트 | `localhost` |
| `CHROMA_HOST` | ChromaDB 호스트 | `db01.server.ivetech.co.kr` |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `CORS_ORIGINS` | 허용된 Origin | `https://dev-cert.i-ve.ai,http://localhost:5100` |

### Frontend (.env.local)

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJ...` |

## Docker 빌드 최적화

BuildKit 캐시 마운트를 사용하여 빌드 시간을 대폭 단축했습니다:
- **uv sync 캐시**: Python 의존성 설치 시간 단축
- **npm ci 캐시**: Node.js 의존성 설치 시간 단축
- **Next.js 빌드 캐시**: 빌드 시간 단축

## 관련 문서

- [Backend CLAUDE.md](../backend/CLAUDE.md)
- [Frontend CLAUDE.md](../frontend/CLAUDE.md)
- [프로젝트 메인 CLAUDE.md](../CLAUDE.md)
