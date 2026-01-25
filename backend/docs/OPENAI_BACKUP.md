# OpenAI 설정 백업 문서

**작성일**: 2026-01-23
**목적**: Qwen3 마이그레이션 전 OpenAI 설정 백업 (롤백용)

---

## 1. 변경 대상 파일 목록

| 파일 | 역할 | 주요 변경 사항 |
|------|------|---------------|
| `app/services/llm_service.py` | 자격증 정보 보강 | AsyncOpenAI → Qwen3 |
| `app/services/study_plan_service.py` | 학습 계획 생성 | AsyncOpenAI → Qwen3 |
| `app/core/config.py` | 환경 설정 | OPENAI_API_KEY → QWEN3 설정 |
| `pyproject.toml` | 의존성 | openai → transformers, qwen-agent |
| `.env` | 환경변수 | OPENAI_API_KEY → QWEN3 설정 |

---

## 2. 현재 OpenAI 설정 백업

### 2.1 llm_service.py

```python
# Import
from openai import AsyncOpenAI

# 클래스 초기화 (line 131-140)
class LLMService:
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4o"

# API 호출 (Phase 1, line 452-460)
response = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
    response_format={"type": "json_object"},
    temperature=0.2,
)

# API 호출 (Phase 2, line 647-655)
response = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
    response_format={"type": "json_object"},
    temperature=0.3,
)
```

### 2.2 study_plan_service.py

```python
# Import
from openai import AsyncOpenAI

# 클래스 초기화 (line 47-56)
class StudyPlanService:
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4o-mini"

# API 호출 (line 229-237)
response = await self.client.chat.completions.create(
    model=self.model,
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
    response_format={"type": "json_object"},
    temperature=0.3,
)
```

### 2.3 config.py

```python
# 환경변수 (line 58)
OPENAI_API_KEY: Optional[str] = None
```

### 2.4 pyproject.toml

```toml
# 의존성 (line 14)
"openai>=1.10.0",
```

### 2.5 .env.example

```env
# External APIs
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 3. 롤백 방법

### 3.1 Git 롤백 (권장)

```bash
# 1. 변경 사항 확인
git status
git diff

# 2. 롤백 (커밋 전)
git checkout -- app/services/llm_service.py
git checkout -- app/services/study_plan_service.py
git checkout -- app/core/config.py
git checkout -- pyproject.toml

# 3. 롤백 (커밋 후)
git revert HEAD  # 마지막 커밋 취소
# 또는
git reset --hard HEAD~1  # 마지막 커밋 삭제 (주의: 변경사항 손실)
```

### 3.2 수동 롤백

1. **llm_service.py** 복원:
   ```python
   # Import 변경
   from openai import AsyncOpenAI

   # __init__ 복원
   self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
   self.model = "gpt-4o"
   ```

2. **study_plan_service.py** 복원:
   ```python
   # Import 변경
   from openai import AsyncOpenAI

   # __init__ 복원
   self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
   self.model = "gpt-4o-mini"
   ```

3. **config.py** 복원:
   ```python
   OPENAI_API_KEY: Optional[str] = None
   ```

4. **pyproject.toml** 복원:
   ```toml
   "openai>=1.10.0",
   ```

5. **의존성 재설치**:
   ```bash
   uv sync --extra dev
   ```

---

## 4. 테스트 검증

롤백 후 반드시 테스트 실행:

```bash
# Unit 테스트
uv run pytest tests/unit/test_llm_service.py -v
uv run pytest tests/unit/test_study_plan_service.py -v

# Integration 테스트
uv run pytest tests/integration/test_study_plans_llm_api.py -v
```

---

## 5. 성능 비교 기준

| 지표 | OpenAI (현재) | Qwen3 (마이그레이션 후) |
|------|--------------|----------------------|
| **응답 시간** | ~2-5초 | TBD |
| **정확도** | 기준선 | TBD |
| **비용** | ~$0.05-0.10/요청 | TBD |
| **JSON 출력** | 안정적 | TBD |

---

## 6. 주의사항

1. **API 키 보안**: `.env` 파일은 Git에 포함하지 않음
2. **테스트 환경**: 실제 API 호출 테스트 시 Mock 사용
3. **롤백 시점**: 성능 저하 또는 오류 발생 시 즉시 롤백
4. **모니터링**: 마이그레이션 후 1주일간 성능 모니터링

---

**문서 작성자**: Claude
**마지막 업데이트**: 2026-01-23
