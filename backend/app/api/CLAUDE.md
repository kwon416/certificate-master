# API 개발 가이드

**Last Updated**: 2026-01-09

## 🚨 CORS 에러 해결 가이드

### 문제 패턴: "가짜 CORS 에러"

브라우저에서 CORS 에러가 표시되지만, **실제 원인은 백엔드에서 발생한 500 에러**입니다.

#### 왜 CORS 에러로 보일까?

```
1. 백엔드 API에서 500 Internal Server Error 발생
2. FastAPI의 예외 처리가 실패하여 응답이 중단됨
3. CORS 미들웨어가 우회되어 CORS 헤더가 응답에 포함되지 않음
4. 브라우저가 "Access-Control-Allow-Origin" 헤더 누락을 감지
5. 브라우저 콘솔에 CORS 에러로 표시됨
```

**핵심**: CORS 설정은 정상이지만, 500 에러로 인해 CORS 헤더가 응답에 포함되지 않는 것!

---

## 🔍 실제 사례 분석

### 사례 1: Study Plans API (2026-01-06)

**증상**:
```
POST /api/v1/study-plans/ → CORS 에러
```

**표면적 에러**:
```
Access to fetch at 'http://localhost:8000/api/v1/study-plans/' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**실제 원인**:
```python
# app/api/v1/study_plans.py (수정 전)
cert_response = (
    supabase.table("certificates")
    .select("id")
    .eq("id", plan_data.certificate_id)
    .single()  # ❌ 데이터 없으면 예외 발생!
    .execute()
)
```

**왜 문제인가?**:
- `.single()` 메서드는 결과가 0개 또는 2개 이상일 때 **Supabase APIError (PGRST116)** 발생
- 이 예외가 처리되지 않으면 500 에러로 변환됨
- 500 에러 발생 시 CORS 미들웨어를 우회하여 CORS 헤더 누락

**해결 방법**:
```python
# app/api/v1/study_plans.py (수정 후)
cert_response = (
    supabase.table("certificates")
    .select("id")
    .eq("id", plan_data.certificate_id)
    .execute()  # ✅ .single() 제거
)

if not cert_response.data:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Certificate not found",
    )
```

---

### 사례 2: Checkins API (2026-01-09)

**증상**:
```
POST /api/v1/checkins/ → CORS 에러
```

**표면적 에러**:
```
Access to fetch at 'http://localhost:8000/api/v1/checkins/' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**실제 원인 (1차)**: `.single()` 메서드 문제
```python
# app/api/v1/checkins.py (수정 전)
plan_response = (
    supabase.table("study_plans")
    .select("id")
    .eq("id", checkin_data.study_plan_id)
    .eq("user_id", user.id)
    .single()  # ❌ 예외 발생 가능!
    .execute()
)
```

**실제 원인 (2차)**: 데이터베이스 스키마 불일치
```
postgrest.exceptions.APIError:
Could not find the 'hours_studied' column of 'checkins' in the schema cache
```
- **데이터베이스**: `study_hours` 컬럼 사용
- **백엔드 코드**: `hours_studied` 사용
- **원인**: 마이그레이션 SQL이 작성되었지만 적용되지 않음

**해결 방법 (1단계)**: `.single()` 제거
```python
# app/api/v1/checkins.py (수정 후)
plan_response = (
    supabase.table("study_plans")
    .select("id")
    .eq("id", checkin_data.study_plan_id)
    .eq("user_id", user.id)
    .execute()  # ✅ .single() 제거
)

if not plan_response.data:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Study plan not found",
    )
```

**해결 방법 (2단계)**: 데이터베이스 마이그레이션 적용
```sql
-- Migration 001: Rename study_hours to hours_studied
ALTER TABLE public.checkins
RENAME COLUMN study_hours TO hours_studied;

-- Migration 002: Fix mood enum values
ALTER TABLE public.checkins
DROP CONSTRAINT IF EXISTS checkins_mood_check;

ALTER TABLE public.checkins
ADD CONSTRAINT checkins_mood_check
CHECK (mood IN ('great', 'good', 'okay', 'tired', 'stressed'));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

---

## ✅ 해결 방법: 4단계 체크리스트

### 1️⃣ CORS 설정 확인 (app/main.py)

```python
# ✅ 올바른 CORS 설정
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # 명시적 origins
    allow_credentials=True,       # credentials 활성화
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

**환경 변수 확인** (`.env`):
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5100
```

**❌ 피해야 할 패턴**:
```python
# ❌ 와일드카드는 credentials와 함께 사용 불가
allow_origins=["*"]
allow_credentials=True  # 브라우저가 거부함!
```

### 2️⃣ `.single()` 메서드 제거

**프로젝트 전체 검색**:
```bash
grep -rn "\.single()" backend/app/api/v1/
```

**수정 전후 비교**:
```python
# ❌ Before
response = (
    supabase.table("items")
    .select("*")
    .eq("id", item_id)
    .single()  # 예외 발생 가능
    .execute()
)
return Item(**response.data)

# ✅ After
response = (
    supabase.table("items")
    .select("*")
    .eq("id", item_id)
    .execute()  # .single() 제거
)

if not response.data:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Item not found",
    )

return Item(**response.data[0])  # 첫 번째 요소 직접 접근
```

### 3️⃣ 데이터베이스 스키마 확인

**Supabase에서 테이블 스키마 확인**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'checkins'
ORDER BY ordinal_position;
```

**코드와 DB 컬럼명 비교**:
- 백엔드 코드에서 사용하는 필드명
- 데이터베이스 실제 컬럼명
- **불일치 발견 시**: 마이그레이션 필요

**마이그레이션 적용**:
```bash
# 마이그레이션 파일 확인
ls backend/scripts/migrations/

# Supabase Dashboard에서 SQL Editor로 실행
# 또는 Supabase MCP tool 사용
```

**스키마 캐시 갱신**:
```sql
NOTIFY pgrst, 'reload schema';
```

**일반적인 스키마 불일치 사례**:
- `study_hours` vs `hours_studied`
- `excellent/neutral` vs `great/okay` (enum 값)
- 누락된 컬럼 (새로 추가된 필드)

### 4️⃣ 백엔드 로그 확인

**서버 재시작 후 로그 확인**:
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

**정상적인 CORS 로그**:
```
📋 CORS Configuration:
  - Environment: development
  - Origins: ['http://localhost:3000', 'http://localhost:5100']
  - Credentials: True
  - Methods: *
  - Headers: *
```

**요청 로그 확인**:
```
🌍 Incoming Request: POST /api/v1/checkins/
📍 Origin: http://localhost:3000
🔑 Authorization: Bearer eyJhbGc...
```

**500 에러 발생 시**:
```
❌ [ERROR] 500 Internal Server Error
   Detail: ...
```
→ 백엔드 로그에서 실제 예외 확인!

---

## 🛠️ 디버깅 팁

### 1. 브라우저 개발자 도구

**Network 탭에서 확인**:
- Status: 200 OK → CORS 설정 정상
- Status: 500 → 백엔드 에러 (CORS가 아님!)
- Status: 0 (cancelled) → 실제 CORS 문제

**Console 탭에서 확인**:
```
❌ "blocked by CORS policy" → 500 에러일 가능성 높음
✅ 실제 응답 데이터 표시 → 정상
```

### 2. 백엔드 로그 모니터링

**Request logging middleware** (`app/main.py`):
```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"🌍 Request: {request.method} {request.url.path}")
    logger.info(f"📍 Origin: {request.headers.get('origin')}")

    response = await call_next(request)

    logger.info(f"📤 Response: {response.status_code}")
    return response
```

### 3. curl 테스트

**CORS 없이 API 직접 테스트**:
```bash
# 인증 없는 요청
curl -X GET http://localhost:8000/api/v1/certificates/search

# 인증 포함 요청
curl -X POST http://localhost:8000/api/v1/checkins/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"study_plan_id": "...", "hours_studied": 2}'
```

**응답 확인**:
- 200 OK → API는 정상, CORS 설정 문제
- 500 Error → 백엔드 로직 문제
- 401 Unauthorized → 인증 문제

---

## 📚 핵심 학습 포인트

### 1. CORS 에러의 진짜 의미

```
"CORS policy has blocked..." ≠ CORS 설정이 틀렸다

실제 의미:
→ 응답에 CORS 헤더가 없다
→ 왜? 500 에러로 미들웨어가 우회되었기 때문!
```

### 2. Supabase `.single()` 메서드의 동작

```python
# 결과가 정확히 1개일 때만 성공
.single()  # 0개 → APIError (PGRST116)
           # 2개 이상 → APIError (PGRST116)

# 안전한 대안
.execute()  # 항상 성공 (빈 배열도 OK)
if not response.data:  # 명시적 체크
    raise HTTPException(...)
```

### 3. FastAPI 예외 처리 순서

```
1. 라우터 핸들러 실행
2. 예외 발생 (처리 안 됨)
3. FastAPI 기본 예외 핸들러 → 500 응답
4. 미들웨어 체인 우회
5. CORS 헤더 누락
6. 브라우저 차단
```

**올바른 예외 처리**:
```python
try:
    response = supabase.table(...).execute()
    if not response.data:
        raise HTTPException(404, "Not found")  # ✅ 명시적 처리
    return response.data[0]
except HTTPException:
    raise  # ✅ HTTPException은 그대로 전달
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, "Internal error")  # ✅ 500도 명시적 처리
```

---

## 📋 체크리스트: CORS 에러 발생 시

- [ ] **1단계**: 브라우저 Network 탭에서 실제 HTTP 상태 코드 확인
  - 500? → 백엔드 에러 (아래 단계 진행)
  - 0? → 실제 CORS 설정 문제

- [ ] **2단계**: 백엔드 로그 확인
  - 예외 발생? → 예외 메시지 읽기
  - 500 에러? → 근본 원인 파악
  - **`PGRST204` 에러?** → 스키마 불일치 (4단계로)

- [ ] **3단계**: `.single()` 검색
  ```bash
  grep -rn "\.single()" backend/app/api/
  ```
  - 발견되면 모두 제거

- [ ] **4단계**: 데이터베이스 스키마 확인
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'your_table';
  ```
  - 코드와 DB 컬럼명 비교
  - 불일치? → 마이그레이션 적용
  - `backend/scripts/migrations/` 확인

- [ ] **5단계**: CORS 설정 확인 (`app/main.py`)
  - `allow_origins`: 명시적 리스트
  - `allow_credentials=True`
  - `.env`의 `CORS_ORIGINS` 확인

- [ ] **6단계**: 서버 재시작
  ```bash
  # CTRL+C로 서버 중지
  uv run uvicorn app.main:app --reload --port 8000
  ```
  - CORS 로그 확인
  - 스키마 캐시 갱신 확인

- [ ] **7단계**: 프론트엔드에서 재테스트
  - 브라우저 캐시 지우기 (Hard Reload)
  - 체크인 기능 테스트
  - 정상 동작 확인

---

## 🎯 정리

### ✅ DO (해야 할 것)

1. **명시적 예외 처리**
   ```python
   if not response.data:
       raise HTTPException(404, "Not found")
   ```

2. **`.single()` 제거**
   ```python
   response = supabase.table(...).execute()
   return Item(**response.data[0])
   ```

3. **명시적 CORS origins**
   ```python
   allow_origins=['http://localhost:3000']
   allow_credentials=True
   ```

4. **백엔드 로그 모니터링**
   - 모든 요청/응답 로깅
   - 예외 스택 트레이스 확인

### ❌ DON'T (하지 말아야 할 것)

1. **와일드카드 + credentials**
   ```python
   allow_origins=['*']       # ❌
   allow_credentials=True    # ❌ 브라우저가 거부!
   ```

2. **`.single()` 무분별 사용**
   ```python
   .single().execute()  # ❌ 예외 발생 가능
   ```

3. **예외 무시**
   ```python
   try:
       ...
   except:
       pass  # ❌ 절대 금지!
   ```

4. **CORS 에러만 보고 판단**
   - 항상 백엔드 로그 확인!
   - Network 탭에서 실제 상태 코드 확인!

---

## 📞 추가 도움말

### 관련 문서
- [FastAPI CORS 공식 문서](https://fastapi.tiangolo.com/tutorial/cors/)
- [Supabase Python Client API](https://supabase.com/docs/reference/python/introduction)

### 문제 해결 이력
- **2026-01-06**: Study Plans API `.single()` 제거
- **2026-01-09**:
  - Checkins API `.single()` 제거 (4곳)
  - 데이터베이스 스키마 불일치 발견 및 수정
  - 마이그레이션 적용 (`study_hours` → `hours_studied`)
  - Mood enum 값 수정 (`excellent/neutral` → `great/okay`)
  - 문서 작성 및 체크리스트 추가

### 기여자
- Claude Sonnet 4.5
- TDD 방식으로 문제 해결 및 문서화

---

**이 문서를 북마크하세요!** 동일한 패턴의 CORS 에러가 발생하면 이 가이드를 참고하세요.
