# 추천 기능 리디자인 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 추천 시스템에 도메인 사전 필터링을 추가하고, 파이프라인을 3단계로 단순화하여 관련 없는 자격증 추천 문제를 해결한다.

**Architecture:** MariaDB에 `domain` 컬럼을 추가하고, ChromaDB 메타데이터에 `domain` 필드를 추가한다. 프론트엔드에서 분야를 선택하면 ChromaDB `where` 필터로 해당 분야만 검색한다. 위저드를 제거하고 "분야 선택 + 자연어" 단일 플로우로 통합한다.

**Tech Stack:** FastAPI, SQLAlchemy, ChromaDB, OpenAI API, Next.js 14, TypeScript, Zustand

---

## Task 1: DB에 domain 컬럼 추가 (백엔드 모델)

**Files:**
- Modify: `backend/app/models/certificate.py:196` (similar_certificates 다음에 추가)
- Test: `backend/tests/unit/test_certificate_model.py` (신규)

**Step 1: 테스트 작성**

```python
# backend/tests/unit/test_certificate_model.py
"""Certificate 모델의 domain 필드 테스트."""
from app.models.certificate import Certificate


def test_certificate_has_domain_field():
    """Certificate 모델에 domain 필드가 존재한다."""
    cert = Certificate(
        title="정보처리기사",
        raw_id="test_domain_cert",
        categories=[{"code": "T", "name": "국가기술자격"}],
        domain="IT/소프트웨어",
    )
    assert cert.domain == "IT/소프트웨어"


def test_certificate_domain_nullable():
    """domain 필드는 nullable이다."""
    cert = Certificate(
        title="테스트자격증",
        raw_id="test_domain_null",
        categories=[{"code": "T", "name": "국가기술자격"}],
    )
    assert cert.domain is None


def test_certificate_to_dict_includes_domain():
    """to_dict()에 domain 필드가 포함된다."""
    cert = Certificate(
        title="정보처리기사",
        raw_id="test_domain_dict",
        categories=[{"code": "T", "name": "국가기술자격"}],
        domain="IT/소프트웨어",
    )
    d = cert.to_dict()
    assert d["domain"] == "IT/소프트웨어"
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd backend && uv run pytest tests/unit/test_certificate_model.py -v
```

Expected: FAIL - `domain` attribute 없음

**Step 3: 구현**

`backend/app/models/certificate.py` 에 추가:

```python
# similar_certificates 컬럼 다음 (약 196행)에 추가:
    domain = Column(
        String(100),
        nullable=True,
        comment="분야 분류 (예: IT/소프트웨어, 건설/건축)",
    )
```

`to_dict()` 메서드에 추가 (약 254행):

```python
    "domain": self.domain,
```

**Step 4: 테스트 실행 → 통과 확인**

```bash
cd backend && uv run pytest tests/unit/test_certificate_model.py -v
```

Expected: PASS

**Step 5: DB 마이그레이션 실행**

```bash
cd backend && uv run python -c "
from app.core.database import get_engine
from sqlalchemy import text
engine = get_engine()
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE certificates ADD COLUMN domain VARCHAR(100) NULL COMMENT \"분야 분류\"'))
    conn.commit()
    print('Migration complete: domain column added')
"
```

**Step 6: 커밋**

```bash
git add backend/app/models/certificate.py backend/tests/unit/test_certificate_model.py
git commit -m "feat: add domain column to certificates model"
```

---

## Task 2: 도메인 자동 분류 스크립트

**Files:**
- Create: `backend/scripts/classify_domains.py`
- Create: `backend/app/core/domains.py` (도메인 상수 및 분류 규칙)

**Step 1: 도메인 상수 정의**

```python
# backend/app/core/domains.py
"""도메인 분류 상수 및 규칙."""

# 사용자에게 보여줄 분야 목록
DOMAIN_LIST = [
    "IT/소프트웨어",
    "전기/전자",
    "건설/건축",
    "기계/금속",
    "화학/환경",
    "금융/회계",
    "의료/보건",
    "안전/방재",
    "식품/농업",
    "디자인/미디어",
    "경영/사무",
    "기타",
]

# 제목 키워드 → 도메인 매핑 (1차 규칙 기반 분류)
TITLE_KEYWORD_TO_DOMAIN: dict[str, str] = {
    # IT/소프트웨어
    "정보처리": "IT/소프트웨어",
    "정보보안": "IT/소프트웨어",
    "컴퓨터": "IT/소프트웨어",
    "소프트웨어": "IT/소프트웨어",
    "멀티미디어": "IT/소프트웨어",
    "데이터": "IT/소프트웨어",
    "빅데이터": "IT/소프트웨어",
    "네트워크": "IT/소프트웨어",
    "전자계산": "IT/소프트웨어",
    "사무자동화": "IT/소프트웨어",
    "리눅스": "IT/소프트웨어",
    "클라우드": "IT/소프트웨어",
    # 전기/전자
    "전기": "전기/전자",
    "전자": "전기/전자",
    "반도체": "전기/전자",
    "통신": "전기/전자",
    "방송": "전기/전자",
    "무선설비": "전기/전자",
    # 건설/건축
    "건설": "건설/건축",
    "건축": "건설/건축",
    "토목": "건설/건축",
    "측량": "건설/건축",
    "콘크리트": "건설/건축",
    "조경": "건설/건축",
    "도배": "건설/건축",
    "방수": "건설/건축",
    "철골": "건설/건축",
    "배관": "건설/건축",
    # 기계/금속
    "기계": "기계/금속",
    "금속": "기계/금속",
    "용접": "기계/금속",
    "주조": "기계/금속",
    "열처리": "기계/금속",
    "판금": "기계/금속",
    "공조냉동": "기계/금속",
    "자동차": "기계/금속",
    "승강기": "기계/금속",
    "보일러": "기계/금속",
    "가스": "기계/금속",
    # 화학/환경
    "화학": "화학/환경",
    "환경": "화학/환경",
    "수질": "화학/환경",
    "대기": "화학/환경",
    "폐기물": "화학/환경",
    "소음": "화학/환경",
    "에너지": "화학/환경",
    "위험물": "화학/환경",
    # 금융/회계
    "세무": "금융/회계",
    "회계": "금융/회계",
    "보험": "금융/회계",
    "경매": "금융/회계",
    "관세": "금융/회계",
    "감정평가": "금융/회계",
    "공인중개": "금융/회계",
    # 의료/보건
    "간호": "의료/보건",
    "의료": "의료/보건",
    "임상": "의료/보건",
    "약사": "의료/보건",
    "방사선": "의료/보건",
    "물리치료": "의료/보건",
    "위생": "의료/보건",
    "영양": "의료/보건",
    # 안전/방재
    "안전": "안전/방재",
    "소방": "안전/방재",
    "산업안전": "안전/방재",
    "비파괴": "안전/방재",
    "품질": "안전/방재",
    # 식품/농업
    "식품": "식품/농업",
    "조리": "식품/농업",
    "제과": "식품/농업",
    "제빵": "식품/농업",
    "농업": "식품/농업",
    "축산": "식품/농업",
    "수산": "식품/농업",
    "원예": "식품/농업",
    "산림": "식품/농업",
    # 디자인/미디어
    "디자인": "디자인/미디어",
    "컬러리스트": "디자인/미디어",
    "미용": "디자인/미디어",
    "사진": "디자인/미디어",
    "영상": "디자인/미디어",
    "인쇄": "디자인/미디어",
    "패션": "디자인/미디어",
    "도자기": "디자인/미디어",
    "보석": "디자인/미디어",
    "가구": "디자인/미디어",
    # 경영/사무
    "경영": "경영/사무",
    "행정": "경영/사무",
    "사회조사": "경영/사무",
    "유통": "경영/사무",
    "물류": "경영/사무",
    "관광": "경영/사무",
    "청소년": "경영/사무",
    "직업상담": "경영/사무",
    "텔레마케팅": "경영/사무",
    "비서": "경영/사무",
}

# preferred_industries 키워드 → 도메인 매핑 (보조 분류용)
INDUSTRY_KEYWORD_TO_DOMAIN: dict[str, str] = {
    "IT": "IT/소프트웨어",
    "소프트웨어": "IT/소프트웨어",
    "게임": "IT/소프트웨어",
    "정보통신": "IT/소프트웨어",
    "전기": "전기/전자",
    "전자": "전기/전자",
    "반도체": "전기/전자",
    "건설": "건설/건축",
    "건축": "건설/건축",
    "금융": "금융/회계",
    "회계": "금융/회계",
    "의료": "의료/보건",
    "제조": "기계/금속",
    "화학": "화학/환경",
    "환경": "화학/환경",
    "식품": "식품/농업",
    "안전": "안전/방재",
}
```

**Step 2: 분류 스크립트 작성**

```python
# backend/scripts/classify_domains.py
"""기존 자격증에 도메인을 자동 분류하는 스크립트.

1차: 제목 키워드 기반 규칙 분류
2차: job_market_info.preferred_industries 기반 보조 분류
3차: 분류 불가 → "기타"

사용법:
    uv run python -m scripts.classify_domains --dry-run  # 미리보기
    uv run python -m scripts.classify_domains             # 실행
"""
import argparse
import sys

from sqlalchemy.orm import Session

from app.core.database import get_engine
from app.core.domains import (
    TITLE_KEYWORD_TO_DOMAIN,
    INDUSTRY_KEYWORD_TO_DOMAIN,
)
from app.models.certificate import Certificate


def classify_certificate(cert: Certificate) -> str:
    """자격증의 도메인을 분류한다."""
    title = cert.title or ""

    # 1차: 제목 키워드 매칭
    for keyword, domain in TITLE_KEYWORD_TO_DOMAIN.items():
        if keyword in title:
            return domain

    # 2차: preferred_industries 매칭
    job_market = cert.job_market_info or {}
    industries = job_market.get("preferred_industries", [])
    if isinstance(industries, list):
        for industry in industries:
            for keyword, domain in INDUSTRY_KEYWORD_TO_DOMAIN.items():
                if keyword in str(industry):
                    return domain

    # 3차: 분류 불가
    return "기타"


def main():
    parser = argparse.ArgumentParser(description="자격증 도메인 분류")
    parser.add_argument("--dry-run", action="store_true", help="변경 없이 미리보기만")
    args = parser.parse_args()

    from sqlalchemy.orm import sessionmaker

    engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    session: Session = SessionLocal()

    try:
        certs = session.query(Certificate).all()
        print(f"총 {len(certs)}개 자격증 분류 시작...")

        domain_counts: dict[str, int] = {}
        classified = 0

        for cert in certs:
            domain = classify_certificate(cert)
            domain_counts[domain] = domain_counts.get(domain, 0) + 1

            if not args.dry_run:
                cert.domain = domain
                classified += 1

        # 결과 출력
        print("\n--- 분류 결과 ---")
        for domain, count in sorted(domain_counts.items(), key=lambda x: -x[1]):
            print(f"  {domain}: {count}개")
        print(f"  합계: {sum(domain_counts.values())}개")

        if args.dry_run:
            print("\n[DRY RUN] 실제 변경 없음")
        else:
            session.commit()
            print(f"\n{classified}개 자격증 도메인 분류 완료")

    except Exception as e:
        session.rollback()
        print(f"오류: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
```

**Step 3: 커밋**

```bash
git add backend/app/core/domains.py backend/scripts/classify_domains.py
git commit -m "feat: add domain classification constants and script"
```

---

## Task 3: ChromaDB 메타데이터에 domain 추가

**Files:**
- Modify: `backend/app/utils/certificate_formatter.py:279-310` (build_certificate_metadata)
- Test: `backend/tests/unit/test_certificate_formatter.py` (신규)

**Step 1: 테스트 작성**

```python
# backend/tests/unit/test_certificate_formatter.py
"""certificate_formatter의 domain 메타데이터 테스트."""
from app.utils.certificate_formatter import build_certificate_metadata


def test_build_metadata_includes_domain():
    """build_certificate_metadata가 domain 필드를 포함한다."""
    cert = {
        "title": "정보처리기사",
        "categories": [{"code": "T", "name": "국가기술자격"}],
        "series": "기사",
        "domain": "IT/소프트웨어",
    }
    metadata = build_certificate_metadata(cert)
    assert metadata["domain"] == "IT/소프트웨어"


def test_build_metadata_domain_defaults_empty():
    """domain이 없으면 빈 문자열로 기본값 설정."""
    cert = {
        "title": "테스트",
        "categories": [],
    }
    metadata = build_certificate_metadata(cert)
    assert metadata["domain"] == ""
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd backend && uv run pytest tests/unit/test_certificate_formatter.py -v
```

**Step 3: 구현**

`backend/app/utils/certificate_formatter.py`의 `build_certificate_metadata()` 리턴 딕셔너리에 추가:

```python
    return {
        # ... 기존 필드들 ...
        "target_company_types": target_company_types[:200],
        # 도메인 분류 (NEW)
        "domain": cert.get("domain", "") or "",
    }
```

**Step 4: 테스트 실행 → 통과 확인**

```bash
cd backend && uv run pytest tests/unit/test_certificate_formatter.py -v
```

**Step 5: 커밋**

```bash
git add backend/app/utils/certificate_formatter.py backend/tests/unit/test_certificate_formatter.py
git commit -m "feat: add domain field to ChromaDB metadata"
```

---

## Task 4: 통합 추천 스키마 (위저드 스키마 대체)

**Files:**
- Modify: `backend/app/schemas/recommendation.py`
- Test: `backend/tests/unit/test_recommendation_schema.py` (신규)

**Step 1: 테스트 작성**

```python
# backend/tests/unit/test_recommendation_schema.py
"""통합 추천 스키마 테스트."""
import pytest
from pydantic import ValidationError
from app.schemas.recommendation import UnifiedRecommendationRequest


def test_unified_request_valid():
    """유효한 통합 추천 요청."""
    req = UnifiedRecommendationRequest(
        domains=["IT/소프트웨어"],
        user_input="비전공자인데 3개월 안에 딸 수 있는 IT 자격증 추천해주세요",
    )
    assert req.domains == ["IT/소프트웨어"]
    assert len(req.user_input) >= 10


def test_unified_request_multiple_domains():
    """복수 도메인 선택."""
    req = UnifiedRecommendationRequest(
        domains=["IT/소프트웨어", "전기/전자"],
        user_input="IT나 전기 쪽 자격증을 준비하고 싶습니다",
    )
    assert len(req.domains) == 2


def test_unified_request_empty_domains_fails():
    """도메인이 비어있으면 실패."""
    with pytest.raises(ValidationError):
        UnifiedRecommendationRequest(
            domains=[],
            user_input="테스트 입력입니다 충분히 길게",
        )


def test_unified_request_short_input_fails():
    """user_input이 10자 미만이면 실패."""
    with pytest.raises(ValidationError):
        UnifiedRecommendationRequest(
            domains=["IT/소프트웨어"],
            user_input="짧음",
        )
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd backend && uv run pytest tests/unit/test_recommendation_schema.py -v
```

**Step 3: 구현**

`backend/app/schemas/recommendation.py` 끝에 추가:

```python
# ===== 통합 추천 스키마 (Redesign) =====


class UnifiedRecommendationRequest(BaseModel):
    """통합 추천 요청 (분야 선택 + 자연어).

    기존 RecommendationRequest(위저드)와 NaturalLanguageRequest를 통합합니다.
    """

    domains: list[str] = Field(
        ...,
        min_length=1,
        description="선택한 분야 목록 (최소 1개)",
    )
    user_input: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="자연어 입력 (10-1000자)",
    )

    @field_validator("domains")
    @classmethod
    def validate_domains(cls, v: list[str]) -> list[str]:
        from app.core.domains import DOMAIN_LIST

        invalid = [d for d in v if d not in DOMAIN_LIST]
        if invalid:
            raise ValueError(f"Invalid domains: {invalid}")
        return v


class UnifiedRecommendationResponse(BaseModel):
    """통합 추천 응답."""

    structured_context: StructuredUserContext = Field(
        ...,
        description="LLM이 구조화한 사용자 상황",
    )
    recommendations: list[RecommendedCertificate] = Field(
        default_factory=list,
        description="추천 자격증 목록",
    )
    query_used: str = Field(
        ...,
        description="벡터 검색에 사용된 쿼리",
    )
    total_matched: int = Field(
        ...,
        ge=0,
        description="조건에 맞는 전체 자격증 수",
    )
```

**Step 4: 테스트 실행 → 통과 확인**

```bash
cd backend && uv run pytest tests/unit/test_recommendation_schema.py -v
```

**Step 5: 커밋**

```bash
git add backend/app/schemas/recommendation.py backend/tests/unit/test_recommendation_schema.py
git commit -m "feat: add unified recommendation request/response schemas"
```

---

## Task 5: ContextExtractor에 쿼리 생성 통합

**Files:**
- Modify: `backend/app/services/llm/context_extractor.py`
- Modify: `backend/app/services/study/prompts/context_extraction.py`
- Test: `backend/tests/unit/test_context_extractor.py` (신규)

**Step 1: 테스트 작성**

```python
# backend/tests/unit/test_context_extractor.py
"""ContextExtractor 통합 테스트 (상황 구조화 + 쿼리 생성)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm.context_extractor import ContextExtractorService


@pytest.fixture
def mock_openai_response():
    """LLM 응답 모킹."""
    return {
        "context": {
            "goal": "취업",
            "employment_status": "학생",
            "major_background": "비전공자",
            "weekly_study_hours": 10,
            "max_study_period_days": 90,
            "difficulty_preference": "중",
            "preferred_industries": ["IT"],
        },
        "search_query": "비전공자 IT 취업 자격증 3개월 준비 가능",
    }


@pytest.mark.asyncio
async def test_extract_context_and_query(mock_openai_response):
    """상황 구조화와 검색 쿼리를 동시에 반환한다."""
    import json

    service = ContextExtractorService(api_key="test-key")

    mock_completion = MagicMock()
    mock_completion.choices = [
        MagicMock(message=MagicMock(content=json.dumps(mock_openai_response)))
    ]

    with patch.object(
        service.client.chat.completions,
        "create",
        new_callable=AsyncMock,
        return_value=mock_completion,
    ):
        context, query = await service.extract_context_and_query(
            user_input="비전공자인데 3개월 안에 IT 자격증 따고 싶어요",
            selected_domains=["IT/소프트웨어"],
        )

    assert context.goal == "취업"
    assert context.major_background == "비전공자"
    assert isinstance(query, str)
    assert len(query) > 0
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd backend && uv run pytest tests/unit/test_context_extractor.py -v
```

**Step 3: 구현**

`backend/app/services/llm/context_extractor.py`에 `extract_context_and_query` 메서드 추가:

```python
    async def extract_context_and_query(
        self,
        user_input: str,
        selected_domains: list[str],
    ) -> tuple[StructuredUserContext, str]:
        """상황 구조화와 검색 쿼리를 동시에 생성합니다.

        기존 extract_context()와 QueryGeneratorService를 통합합니다.

        Args:
            user_input: 사용자의 자연어 입력.
            selected_domains: 사용자가 선택한 분야 목록.

        Returns:
            (StructuredUserContext, search_query) 튜플.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY not configured")

        logger.info(f"[ContextExtractor] Processing (unified): {user_input[:50]}...")

        # 통합 프롬프트로 LLM 호출
        from app.services.study.prompts.context_extraction import (
            UNIFIED_SYSTEM_PROMPT,
            UNIFIED_USER_PROMPT_TEMPLATE,
        )

        user_prompt = UNIFIED_USER_PROMPT_TEMPLATE.format(
            user_input=user_input,
            selected_domains=", ".join(selected_domains),
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": UNIFIED_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")

        data = json.loads(content)
        context = StructuredUserContext(**data["context"])
        search_query = data.get("search_query", user_input)

        return context, search_query
```

`backend/app/services/study/prompts/context_extraction.py`에 통합 프롬프트 추가:

```python
# 기존 프롬프트 유지하고 아래에 추가

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
```

**Step 4: 테스트 실행 → 통과 확인**

```bash
cd backend && uv run pytest tests/unit/test_context_extractor.py -v
```

**Step 5: 커밋**

```bash
git add backend/app/services/llm/context_extractor.py backend/app/services/study/prompts/context_extraction.py backend/tests/unit/test_context_extractor.py
git commit -m "feat: integrate query generation into context extractor"
```

---

## Task 6: 추천 서비스 리팩터링 (3단계 파이프라인)

**Files:**
- Modify: `backend/app/services/study/natural_recommendation_service.py` (전체 리팩터링)
- Test: `backend/tests/unit/test_natural_recommendation_service.py` (신규)

**Step 1: 테스트 작성**

```python
# backend/tests/unit/test_natural_recommendation_service.py
"""리디자인된 추천 서비스 테스트."""
from app.services.study.natural_recommendation_service import NaturalRecommendationService


def test_calculate_score_high_similarity():
    """유사도가 높으면 점수가 높다."""
    service = NaturalRecommendationService(db=None)
    from app.schemas.recommendation import StructuredUserContext

    context = StructuredUserContext(
        goal="취업",
        employment_status="학생",
        major_background="비전공자",
        weekly_study_hours=10,
        max_study_period_days=90,
        difficulty_preference="중",
        preferred_industries=["IT"],
    )

    cert = {
        "feasibility_info": {"self_study_possible": True},
        "study_period_days": 60,
        "job_market_info": {"job_posting_frequency": "많음"},
    }

    score = service._calculate_score(0.8, cert, context)
    # 0.8 * 70 = 56 + 10 (비전공자) + 10 (채용시장) = 76
    assert score >= 70


def test_calculate_score_non_major_penalty():
    """비전공자인데 독학 불가면 감점."""
    service = NaturalRecommendationService(db=None)
    from app.schemas.recommendation import StructuredUserContext

    context = StructuredUserContext(
        goal="취업",
        employment_status="학생",
        major_background="비전공자",
        weekly_study_hours=10,
        max_study_period_days=90,
        difficulty_preference="중",
        preferred_industries=["IT"],
    )

    cert = {
        "feasibility_info": {"self_study_possible": False},
        "study_period_days": 60,
        "job_market_info": {},
    }

    score = service._calculate_score(0.5, cert, context)
    # 0.5 * 70 = 35 - 15 (감점) = 20
    assert score <= 25


def test_calculate_score_non_major_null_neutral():
    """비전공자인데 독학 정보 없으면 중립."""
    service = NaturalRecommendationService(db=None)
    from app.schemas.recommendation import StructuredUserContext

    context = StructuredUserContext(
        goal="취업",
        employment_status="학생",
        major_background="비전공자",
        weekly_study_hours=10,
        max_study_period_days=90,
        difficulty_preference="중",
        preferred_industries=["IT"],
    )

    cert = {
        "feasibility_info": {},
        "study_period_days": 60,
        "job_market_info": {},
    }

    score_null = service._calculate_score(0.5, cert, context)
    # self_study_possible가 None이면 중립 (보너스도 감점도 없음)
    # 0.5 * 70 = 35
    assert 30 <= score_null <= 40
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
cd backend && uv run pytest tests/unit/test_natural_recommendation_service.py -v
```

**Step 3: 구현 - `_calculate_score` 메서드 교체**

`backend/app/services/study/natural_recommendation_service.py`에서 `_calculate_final_score`를 `_calculate_score`로 교체:

```python
    def _calculate_score(
        self,
        similarity: float,
        cert: dict,
        context: StructuredUserContext,
    ) -> int:
        """새로운 점수 계산 공식.

        도메인 필터가 사전 적용되므로 유사도 비중 70%.

        Args:
            similarity: 벡터 유사도 (0.0-1.0).
            cert: 자격증 데이터.
            context: 구조화된 사용자 상황.

        Returns:
            최종 점수 (0-100).
        """
        score = similarity * 70  # 벡터 유사도 70%

        # 비전공자 보너스/감점
        feasibility_info = cert.get("feasibility_info") or {}
        if context.major_background == "비전공자":
            self_study = feasibility_info.get("self_study_possible")
            if self_study is True:
                score += 10
            elif self_study is False:
                score -= 15
            # None이면 중립 (0점)

        # 재직자 보너스
        if context.employment_status == "재직 중":
            study_period = cert.get("study_period_days") or 90
            if study_period <= context.max_study_period_days * 0.7:
                score += 10
            elif study_period <= context.max_study_period_days:
                score += 5

        # 채용 시장 보너스
        job_market = cert.get("job_market_info") or {}
        frequency = job_market.get("job_posting_frequency", "")
        if frequency in ["매우 많음", "많음"]:
            score += 10

        return min(100, max(0, int(score)))
```

**Step 4: `get_recommendations` 메서드를 3단계 파이프라인으로 리팩터링**

전체 `get_recommendations` 메서드를 교체합니다. 핵심 변경:
- Step 2에서 `filter_dict={"domain": {"$contains": selected_domain}}` 사용
- 하이브리드 검색, 리랭커, 적응형 임계값 제거
- `_calculate_final_score` → `_calculate_score` 교체

```python
    async def get_recommendations(
        self, request  # UnifiedRecommendationRequest 또는 NaturalLanguageRequest
    ):
        # Step 1: 상황 구조화 + 쿼리 생성 (LLM 1회)
        domains = getattr(request, "domains", None)
        user_input = getattr(request, "user_input", None) or getattr(request, "user_input", "")

        if domains:
            # 통합 요청: extract_context_and_query 사용
            context, query = await self.context_extractor.extract_context_and_query(
                user_input=user_input,
                selected_domains=domains,
            )
        else:
            # 레거시 호환: 기존 방식
            context = await self.context_extractor.extract_context(user_input)
            query = user_input

        # Step 2: 도메인 필터 + 벡터 검색 + 소프트 필터
        filter_dict = None
        if domains and len(domains) == 1:
            filter_dict = {"domain": {"$contains": domains[0]}}
        elif domains and len(domains) > 1:
            filter_dict = {"$or": [{"domain": {"$contains": d}} for d in domains]}

        raw_results = self.vector_store.search_records(
            namespace=VectorStoreService.NAMESPACE,
            query=query,
            top_k=RECOMMENDATION_TOP_K * 2,
            filter_dict=filter_dict,
        )

        # 고정 임계값 필터링 (0.25)
        MIN_SCORE = 0.25
        similar_results = [r for r in raw_results if r.get("score", 0) >= MIN_SCORE]

        # ... (기존 코드: 자격증 조회, 점수 계산, 추천 이유 생성)
```

**Step 5: 테스트 실행 → 통과 확인**

```bash
cd backend && uv run pytest tests/unit/test_natural_recommendation_service.py -v
```

**Step 6: 커밋**

```bash
git add backend/app/services/study/natural_recommendation_service.py backend/tests/unit/test_natural_recommendation_service.py
git commit -m "refactor: simplify recommendation pipeline to 3 steps with domain filtering"
```

---

## Task 7: API 엔드포인트 통합

**Files:**
- Modify: `backend/app/api/v1/recommendations.py`

**Step 1: 통합 엔드포인트 추가 (기존 유지)**

```python
# 기존 2개 엔드포인트 유지 + 통합 엔드포인트 추가
@router.post("/unified", response_model=UnifiedRecommendationResponse)
async def get_unified_recommendations(
    request: UnifiedRecommendationRequest,
    db: DBSession,
) -> UnifiedRecommendationResponse:
    """통합 추천 (분야 선택 + 자연어).

    Args:
        request: 통합 추천 요청 (domains + user_input)
        db: SQLAlchemy 세션

    Returns:
        UnifiedRecommendationResponse
    """
    service = NaturalRecommendationService(db)
    return await service.get_unified_recommendations(request)
```

**Step 2: 커밋**

```bash
git add backend/app/api/v1/recommendations.py
git commit -m "feat: add unified recommendation endpoint"
```

---

## Task 8: 프론트엔드 - DomainSelector 컴포넌트

**Files:**
- Create: `frontend/src/components/recommend/domain-selector.tsx`

**Step 1: 컴포넌트 작성**

```tsx
// frontend/src/components/recommend/domain-selector.tsx
'use client'

import { cn } from '@/lib/utils'
import {
  Monitor, Zap, Building2, Wrench,
  FlaskConical, Coins, Heart, Shield,
  Utensils, Palette, Briefcase, MoreHorizontal,
} from 'lucide-react'

const DOMAINS = [
  { id: 'IT/소프트웨어', label: 'IT/소프트웨어', icon: Monitor },
  { id: '전기/전자', label: '전기/전자', icon: Zap },
  { id: '건설/건축', label: '건설/건축', icon: Building2 },
  { id: '기계/금속', label: '기계/금속', icon: Wrench },
  { id: '화학/환경', label: '화학/환경', icon: FlaskConical },
  { id: '금융/회계', label: '금융/회계', icon: Coins },
  { id: '의료/보건', label: '의료/보건', icon: Heart },
  { id: '안전/방재', label: '안전/방재', icon: Shield },
  { id: '식품/농업', label: '식품/농업', icon: Utensils },
  { id: '디자인/미디어', label: '디자인/미디어', icon: Palette },
  { id: '경영/사무', label: '경영/사무', icon: Briefcase },
  { id: '기타', label: '기타', icon: MoreHorizontal },
] as const

interface DomainSelectorProps {
  selected: string[]
  onSelect: (domains: string[]) => void
}

export function DomainSelector({ selected, onSelect }: DomainSelectorProps) {
  const toggleDomain = (domainId: string) => {
    if (selected.includes(domainId)) {
      onSelect(selected.filter((d) => d !== domainId))
    } else {
      onSelect([...selected, domainId])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          어떤 분야에 관심이 있으세요?
        </h2>
        <p className="text-muted-foreground text-sm">
          관심 분야를 선택해주세요 (복수 선택 가능)
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {DOMAINS.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggleDomain(id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600',
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: 커밋**

```bash
git add frontend/src/components/recommend/domain-selector.tsx
git commit -m "feat: add DomainSelector component"
```

---

## Task 9: 프론트엔드 - 추천 스토어/API/페이지 통합

**Files:**
- Modify: `frontend/src/stores/recommend-store.ts`
- Modify: `frontend/src/lib/api/recommendations.ts`
- Modify: `frontend/src/app/recommend/recommend-content.tsx`

**Step 1: API 클라이언트에 통합 엔드포인트 추가**

`frontend/src/lib/api/recommendations.ts`에 추가:

```typescript
export interface UnifiedRecommendationRequest {
  domains: string[]
  user_input: string
}

export interface UnifiedRecommendationResponse {
  structured_context: StructuredUserContext
  recommendations: RecommendedCertificate[]
  query_used: string
  total_matched: number
}

// recommendationsAPI 객체에 추가:
  async getUnifiedRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<UnifiedRecommendationResponse> {
    const minLoadingTime = 2000
    const startTime = Date.now()

    try {
      const response = await api.post<UnifiedRecommendationResponse>(
        '/api/v1/recommendations/unified',
        request
      )

      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      return response
    } catch (error) {
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      throw error
    }
  },
```

**Step 2: 스토어 단순화**

`frontend/src/stores/recommend-store.ts`에 통합 상태 추가:

```typescript
// 기존 상태 유지 + 통합 상태 추가
interface RecommendState {
  // 통합 플로우
  selectedDomains: string[]
  unifiedInput: string
  unifiedStep: 'domain' | 'input' | 'loading' | 'results'

  // Actions
  setSelectedDomains: (domains: string[]) => void
  setUnifiedInput: (input: string) => void
  setUnifiedStep: (step: 'domain' | 'input' | 'loading' | 'results') => void
  resetUnified: () => void
}
```

**Step 3: recommend-content.tsx 재작성**

2단계 플로우로 재작성:
1. DomainSelector → 도메인 선택
2. 자연어 입력 → API 호출 → 결과 표시

**Step 4: 커밋**

```bash
git add frontend/src/stores/recommend-store.ts frontend/src/lib/api/recommendations.ts frontend/src/app/recommend/recommend-content.tsx
git commit -m "feat: integrate unified recommendation flow in frontend"
```

---

## Task 10: 도메인 분류 실행 + ChromaDB 재인덱싱

**Step 1: 도메인 분류 (dry run)**

```bash
cd backend && uv run python -m scripts.classify_domains --dry-run
```

**Step 2: 도메인 분류 (실행)**

```bash
cd backend && uv run python -m scripts.classify_domains
```

**Step 3: ChromaDB 재인덱싱**

```bash
cd backend && uv run python -m scripts.reindex_all
```

**Step 4: 커밋**

```bash
git commit -m "chore: classify domains and reindex ChromaDB"
```

---

## Task 11: 기존 코드 정리 (삭제)

> 주의: 모든 기능이 통합 엔드포인트로 동작하는 것을 확인한 후 진행

**삭제 대상 (백엔드):**
- `backend/app/services/study/reranker.py`
- `backend/app/services/study/hybrid_search.py`
- `backend/app/services/study/adaptive_threshold.py`
- `backend/app/services/study/query_generator.py`
- `backend/app/services/recommendation_service.py`

**삭제 대상 (프론트엔드):**
- `frontend/src/components/recommend/interaction-wizard.tsx`
- `frontend/src/components/recommend/wizard-progress.tsx`
- `frontend/src/components/recommend/wizard-step.tsx`
- `frontend/src/components/recommend/option-card.tsx`
- `frontend/src/components/recommend/time-slider.tsx`
- `frontend/src/components/recommend/natural-input.tsx`
- `frontend/src/components/recommend/natural-results.tsx`

**커밋:**

```bash
git add -A
git commit -m "chore: remove deprecated wizard and complex pipeline code"
```

---

## Task 순서 의존성

```
Task 1 (DB domain 컬럼) ─┬─→ Task 2 (분류 스크립트) ─→ Task 10 (분류 실행)
                          ├─→ Task 3 (ChromaDB 메타데이터)
                          └─→ Task 4 (통합 스키마) ─→ Task 5 (ContextExtractor 통합)
                                                     ↓
                              Task 6 (서비스 리팩터링) ─→ Task 7 (API 엔드포인트)
                                                         ↓
                              Task 8 (DomainSelector) ─→ Task 9 (FE 통합) ─→ Task 11 (정리)
```

- Task 1은 모든 태스크의 기반
- Task 2,3,4는 독립적으로 병렬 진행 가능
- Task 5는 Task 4에 의존
- Task 6은 Task 3,5에 의존
- Task 8은 독립적 (프론트엔드)
- Task 10은 Task 1,2,3 완료 후
- Task 11은 모든 태스크 완료 후
