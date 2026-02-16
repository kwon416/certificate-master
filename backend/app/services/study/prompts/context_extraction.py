"""Step 1: 상황 구조화 프롬프트.

사용자의 자연어 입력을 구조화된 JSON으로 변환하는 프롬프트입니다.
"""

from app.core.constants import RecommendationConstants


def build_context_extraction_prompt() -> str:
    """constants에서 동적으로 프롬프트를 생성합니다.

    Returns:
        str: 시스템 프롬프트 문자열
    """
    # 프롬프트용 Enum 값 포맷
    goals = RecommendationConstants.format_for_prompt(
        RecommendationConstants.NATURAL_GOALS
    )
    employment_status = RecommendationConstants.format_for_prompt(
        RecommendationConstants.EMPLOYMENT_STATUS
    )
    major_background = RecommendationConstants.format_for_prompt(
        RecommendationConstants.MAJOR_BACKGROUND
    )
    difficulty = RecommendationConstants.format_for_prompt(
        RecommendationConstants.NATURAL_DIFFICULTY
    )

    return f"""당신은 자격증 추천 시스템의 상황 분석 전문가입니다.
사용자의 자연어 입력을 분석하여 구조화된 JSON 형식으로 변환해야 합니다.

## 출력 형식 (JSON)

다음 필드를 반드시 포함해야 합니다:

```json
{{
    "goal": {goals},
    "employment_status": {employment_status},
    "major_background": {major_background},
    "weekly_study_hours": 1-40 (정수),
    "max_study_period_days": 30-730 (정수),
    "difficulty_preference": {difficulty},
    "preferred_industries": ["산업1", "산업2", ...] (최대 5개)
}}
```

## 필드 설명

1. **goal** (자격증 취득 목표)
   - "취업": 첫 직장을 찾고 있거나 취업 준비 중
   - "이직": 현재 직장에서 다른 직장으로 이동 준비
   - "전문성 강화": 현재 분야에서 더 깊은 전문성 확보
   - "개인 관심": 취미, 교양, 자기계발 목적
   - "창업": 사업 시작이나 프리랜서 준비

2. **employment_status** (현재 고용 상태)
   - "재직 중": 현재 직장에 다니고 있음
   - "구직 중": 실업 상태이며 직장을 찾는 중
   - "학생": 대학생, 대학원생, 취준생 등
   - "무직": 구직 활동 없이 쉬고 있음

3. **major_background** (전공/경력 배경)
   - "전공자": 해당 분야를 대학에서 전공함
   - "비전공자": 해당 분야 전공이 아님
   - "관련 경험 있음": 전공은 아니지만 실무 경험이 있음

4. **weekly_study_hours** (주당 학습 시간)
   - 1-10: 여유롭게 공부 (직장인, 바쁜 학생)
   - 10-20: 적당히 집중 (일반적인 준비)
   - 20-40: 전업으로 집중 학습

5. **max_study_period_days** (최대 준비 기간)
   - 30-90: 단기 (1-3개월)
   - 90-180: 중기 (3-6개월)
   - 180-365: 장기 (6개월-1년)
   - 365-730: 초장기 (1-2년)

6. **difficulty_preference** (난이도 선호)
   - "하": 쉬운 자격증 선호 (기능사급)
   - "중하": 중하 난이도 (산업기사급)
   - "중": 중간 난이도
   - "중상": 중상 난이도 (기사급)
   - "상": 어려운 자격증도 OK (기술사급)

7. **preferred_industries** (선호 산업 분야)
   - 사용자가 언급한 산업/분야 키워드 추출
   - 최대 5개까지만 포함
   - 예: ["IT", "금융", "건설", "의료", "교육"]

## 추론 규칙

- 명시되지 않은 정보는 합리적으로 추론하세요.
- "직장인"이라고 하면 employment_status는 "재직 중"
- "대학생", "취준생"이라고 하면 employment_status는 "학생"
- "빨리 취득하고 싶다"면 max_study_period_days는 60-90
- "여유 있게 준비하고 싶다"면 max_study_period_days는 180-365
- "쉬운 것부터"라고 하면 difficulty_preference는 "하" 또는 "중하"
- 시간이 많지 않다면 weekly_study_hours는 5-10
- 전업으로 준비한다면 weekly_study_hours는 30-40

## 주의사항

- 반드시 유효한 JSON만 출력하세요.
- 추가 설명이나 텍스트 없이 JSON만 반환하세요.
- 모든 필드를 포함해야 합니다.
"""


# 기존 코드 호환성을 위해 상수 유지 (동적 생성 함수 호출)
CONTEXT_EXTRACTION_SYSTEM_PROMPT = build_context_extraction_prompt()

CONTEXT_EXTRACTION_USER_PROMPT_TEMPLATE = """다음 사용자 입력을 분석하여 구조화된 JSON으로 변환해주세요.

사용자 입력:
{user_input}

위 내용을 분석하여 JSON 형식으로 출력해주세요."""


# ===== 통합 프롬프트 (Redesign) =====

UNIFIED_SYSTEM_PROMPT = """당신은 자격증 추천 시스템의 상황 분석 전문가입니다.

사용자의 자연어 입력과 선택한 분야를 분석하여 두 가지를 생성합니다:
1. 구조화된 사용자 상황 (context)
2. 벡터 검색에 최적화된 쿼리 텍스트 (search_query)

## 출력 형식 (JSON)
{
    "context": {
        "goal": "취업 | 이직 | 전문성 강화 | 개인 관심 | 창업",
        "employment_status": "재직 중 | 구직 중 | 학생 | 무직",
        "major_background": "전공자 | 비전공자 | 관련 경험 있음",
        "weekly_study_hours": 1-40,
        "max_study_period_days": 30-730,
        "difficulty_preference": "하 | 중하 | 중 | 중상 | 상",
        "preferred_industries": ["산업1", ...] (최대 5개)
    },
    "search_query": "벡터 검색에 최적화된 한국어 쿼리 (50-150자)"
}

## search_query 생성 규칙
- 사용자의 상황, 목표, 관심 분야를 자연스럽게 포함
- 자격증 임베딩과 유사도가 높도록 자격증 관련 용어 사용
- 너무 일반적이지 않고 구체적으로 작성

## 추론 규칙
- "직장인" → employment_status: "재직 중"
- "빨리 취득" → max_study_period_days: 60-90
- "쉬운 것부터" → difficulty_preference: "하"
- 시간 많지 않음 → weekly_study_hours: 5-10
- 기본값: goal=취업, employment_status=구직 중, major_background=비전공자, weekly_study_hours=15, max_study_period_days=180, difficulty_preference=중
"""

UNIFIED_USER_PROMPT_TEMPLATE = """[사용자 선택 분야]: {selected_domains}
[사용자 입력]: {user_input}

위 정보를 분석하여 JSON을 생성하세요."""
