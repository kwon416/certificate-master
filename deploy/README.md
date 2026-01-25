# Certificate Master - 개발 서버 배포 가이드

## 배포 정보
- **도메인**: https://dev-cert.i-ve.ai
- **환경**: Development
- **내부 포트**: 5100 (외부 Nginx가 도메인과 연결)

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

**Note**: Nginx 없이 Next.js가 직접 5100 포트에서 서빙하고, `/api/*` 요청은 Next.js rewrites로 백엔드로 프록시됩니다.

## 배포 단계

### 1. 환경 변수 설정

각 디렉토리의 `.env` 파일을 사용합니다:
- **백엔드**: `backend/.env`
- **프론트엔드**: `frontend/.env` (또는 `frontend/.env.local`)

```bash
# 백엔드 환경 변수 설정
cd backend
cp .env.example .env
nano .env  # 실제 값 입력

# 프론트엔드 환경 변수 설정
cd ../frontend
cp .env.sample .env
nano .env  # 실제 값 입력
```

### 2. .env 파일 로컬에서 서버로 복사 (권장)

```bash
# 로컬에서 서버로 복사 (프로젝트 루트에서)
scp backend/.env user@dev-server:/path/to/certificate-master/backend/.env
scp frontend/.env user@dev-server:/path/to/certificate-master/frontend/.env
```

### 3. Docker 이미지 빌드 및 실행

```bash
# 개발 서버에서 실행
cd deploy

# 이미지 빌드
docker-compose build

# 컨테이너 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

### 4. 배포 확인

```bash
# Health check (내부)
curl http://localhost:5100/health

# Health check (외부)
curl https://dev-cert.i-ve.ai/health

# API 문서 확인
# 브라우저에서: https://dev-cert.i-ve.ai/docs

# Frontend 확인
# 브라우저에서: https://dev-cert.i-ve.ai
```

## 운영 명령어

### 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 서비스별 로그
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 재시작
```bash
# 전체 재시작
docker-compose restart

# 서비스별 재시작
docker-compose restart backend
docker-compose restart frontend
```

### 업데이트 배포
```bash
# 코드 pull
git pull origin main

# 이미지 재빌드 및 재시작
docker-compose build
docker-compose up -d
```

### 컨테이너 중지
```bash
# 중지 (컨테이너 유지)
docker-compose stop

# 중지 및 제거
docker-compose down

# 볼륨까지 제거
docker-compose down -v
```

## 환경 변수 설명

### Backend (.env)

| 변수 | 설명 | 예시 |
|------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_DB_URL` | MariaDB 연결 URL | `mysql+pymysql://user:pw@host:3306/db` |
| `CHROMA_HOST` | ChromaDB 호스트 | `db01.server.ivetech.co.kr` |
| `CHROMA_PORT` | ChromaDB 포트 | `38000` |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `BRAVE_API_KEY` | Brave Search API 키 | `BSA...` |
| `CORS_ORIGINS` | 허용된 Origin | `https://dev-cert.i-ve.ai` |

### Frontend (.env.frontend)

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://dev-cert.i-ve.ai/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJ...` |

## 트러블슈팅

### 1. 포트 충돌
```bash
# 5100 포트 사용 중인 프로세스 확인
lsof -i :5100

# 프로세스 종료
kill -9 <PID>
```

### 2. 컨테이너 빌드 실패
```bash
# 캐시 없이 빌드
docker-compose build --no-cache

# 특정 서비스만 빌드
docker-compose build backend
```

### 3. 데이터베이스 연결 실패
```bash
# 컨테이너에서 DB 연결 테스트
docker exec -it cert-master-backend bash
python -c "from app.core.config import get_settings; print(get_settings().SUPABASE_DB_URL)"
```

### 4. CORS 에러
- `.env`의 `CORS_ORIGINS`에 프론트엔드 도메인 추가
- nginx.conf의 CORS 헤더 확인

## 보안 주의사항

1. **`.env` 파일은 Git에 커밋하지 마세요**
2. **API 키는 환경 변수로만 관리**
3. **CORS는 필요한 도메인만 허용**
4. **프로덕션에서는 DEBUG=false 설정**

## 관련 문서

- [Backend CLAUDE.md](../backend/CLAUDE.md)
- [Frontend CLAUDE.md](../frontend/CLAUDE.md)
- [프로젝트 메인 CLAUDE.md](../CLAUDE.md)
