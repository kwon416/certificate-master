# LLM 프롬프트-스키마 매핑 문서

이 문서는 LLM 프롬프트의 JSON 구조와 Pydantic 스키마 간의 매핑을 정의합니다.

## 1. Phase 1: 추출 (Extraction)

### 1.1 프롬프트 JSON 구조 → Pydantic 모델

```
프롬프트 JSON 필드              → Pydantic 모델.필드
─────────────────────────────────────────────────────────
overview_draft                  → Phase1Extraction.overview_draft (str)
exam_info.subjects              → ExtractedExamInfo.subjects (list[str])
exam_info.exam_type             → ExtractedExamInfo.exam_type (str)
exam_info.passing_criteria      → ExtractedExamInfo.passing_criteria (str)
exam_info.total_fee             → ExtractedExamInfo.total_fee (str | None)
exam_info.acquisition_method    → ExtractedExamInfo.acquisition_method (str | None)
career_info.use_cases           → ExtractedCareerInfo.use_cases (list[str])
career_info.related_jobs        → ExtractedCareerInfo.related_jobs (list[str])
career_info.average_salary      → ExtractedCareerInfo.average_salary (str | None)
career_info.industry            → ExtractedCareerInfo.industry (list[str])
study_guide.study_methods       → ExtractedStudyGuide.study_methods (list[str])
study_guide.key_exam_topics     → ExtractedStudyGuide.key_exam_topics (list[dict])
study_guide.recommended_books   → ExtractedStudyGuide.recommended_books (list[dict])
study_guide.success_tips        → ExtractedStudyGuide.success_tips (list[str])
job_market_info.job_posting_frequency    → ExtractedJobMarketInfo.job_posting_frequency (str | None)
job_market_info.preferred_industries     → ExtractedJobMarketInfo.preferred_industries (list[str])
job_market_info.requirement_type         → ExtractedJobMarketInfo.requirement_type (str | None)
cost_breakdown.exam_fee         → ExtractedCostBreakdown.exam_fee (str | None)
cost_breakdown.textbook_cost    → ExtractedCostBreakdown.textbook_cost (str | None)
feasibility_info.non_major_pass_rate     → ExtractedFeasibilityInfo.non_major_pass_rate (str | None)
feasibility_info.minimum_study_period    → ExtractedFeasibilityInfo.minimum_study_period (int | None)
```

### 1.2 자동 정제 (Validators)

| 필드 | Validator | 동작 |
|------|-----------|------|
| `recommended_books` | `sanitize_books` | placeholder 제거, 중복 제거, 빈 값 필터링 |
| `preferred_industries` | `coerce_none_to_empty_list` | None → [] 변환 |
| `difficulty` | `coerce_difficulty_to_int` | None → 3 (기본값) |

---

## 2. Phase 2: 정제 (Refinement)

### 2.1 프롬프트 JSON → CertificateEnrichment

```
프롬프트 JSON 필드              → CertificateEnrichment.필드
─────────────────────────────────────────────────────────
overview                        → overview (str)
difficulty                      → difficulty (int, 1-5)
study_period                    → study_period (int, 일 단위)
passing_rate                    → passing_rate (float | None)
exam_info                       → exam_info (dict)
career_info                     → career_info (dict)
study_guide                     → study_guide (dict)
job_market_info                 → job_market_info (dict)
cost_breakdown                  → cost_breakdown (dict)
feasibility_info                → feasibility_info (dict)
```

---

## 3. 자연어 추천: 상황 구조화

### 3.1 프롬프트 JSON → StructuredUserContext

```
프롬프트 JSON 필드              → StructuredUserContext.필드
─────────────────────────────────────────────────────────
goal                            → goal (str)
                                  유효값: constants.NATURAL_GOALS
employment_status               → employment_status (str)
                                  유효값: constants.EMPLOYMENT_STATUS
major_background                → major_background (str)
                                  유효값: constants.MAJOR_BACKGROUND
weekly_study_hours              → weekly_study_hours (int, 1-40)
max_study_period_days           → max_study_period_days (int, 30-730)
difficulty_preference           → difficulty_preference (str)
                                  유효값: constants.NATURAL_DIFFICULTY
preferred_industries            → preferred_industries (list[str], max 5)
```

### 3.2 Enum 값 중앙 관리

모든 Enum 값은 `app/core/constants.py`에서 관리됩니다:

```python
from app.core.constants import RecommendationConstants

RecommendationConstants.NATURAL_GOALS        # ["취업", "이직", ...]
RecommendationConstants.EMPLOYMENT_STATUS    # ["재직 중", "구직 중", ...]
RecommendationConstants.MAJOR_BACKGROUND     # ["전공자", "비전공자", ...]
RecommendationConstants.NATURAL_DIFFICULTY   # ["상", "중상", "중", ...]
```

프롬프트는 `build_context_extraction_prompt()` 함수를 통해 동적으로 생성되어
constants와 항상 동기화됩니다.

---

## 4. 스키마 변환

### 4.1 StructuredUserContext → RecommendationRequest

`structured_to_recommendation_request()` 함수를 사용:

```python
from app.schemas.recommendation import (
    StructuredUserContext,
    structured_to_recommendation_request,
)

context = StructuredUserContext(...)
request = structured_to_recommendation_request(context)
```

매핑 규칙:

| StructuredUserContext | RecommendationRequest | 변환 규칙 |
|-----------------------|----------------------|-----------|
| goal | purpose | 문자열 매핑 |
| max_study_period_days | study_timeline | 기간 구간화 |
| difficulty_preference | difficulty_preference | 5단계 → 3단계 |
| employment_status | current_status | 문자열 매핑 |
| weekly_study_hours | study_commitment | 시간 구간화 |
| preferred_industries | target_industries | 그대로 전달 |

---

## 5. 필드 의미론 (유사 이름 구분)

### 5.1 industry vs preferred_industries

| 필드 | 위치 | 의미 | 예시 |
|------|------|------|------|
| `career_info.industry` | 자격증 속성 | 자격증이 활용되는 산업 | IT, 금융, 제조 |
| `job_market_info.preferred_industries` | 채용 관점 | 자격증을 선호하는 기업군 | 세무법인, 대기업 재무팀 |
| `StructuredUserContext.preferred_industries` | 사용자 선호 | 사용자가 가고 싶은 산업 | IT, 스타트업, 게임 |

자세한 내용은 `tests/unit/test_field_semantics.py` 참조.

---

## 6. 테스트 커버리지

| 테스트 파일 | 검증 내용 |
|------------|----------|
| `test_constants_consistency.py` | Enum 값 일관성, 프롬프트-스키마 동기화 |
| `test_pydantic_sanitization.py` | Validator 자동 정제 동작 |
| `test_field_semantics.py` | 필드 의미론 문서화 |
| `test_context_conversion.py` | 스키마 변환 함수 |
