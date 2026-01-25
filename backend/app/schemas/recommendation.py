"""Pydantic schemas for Recommendation API.

This module defines request/response schemas for certificate recommendation endpoints.
"""


from pydantic import BaseModel, Field, field_validator

from .certificate import Certificate


# Valid values for each field
VALID_PURPOSES = [
    "취업",
    "이직",
    "커리어 전문성 강화",
    "개인 관심 / 교양",
    "창업 / 실무 활용",
]

VALID_INTEREST_DOMAINS = [
    "기획/전략",
    "마케팅/홍보/조사",
    "회계/세무/재무",
    "인사/노무/HRD",
    "총무/법무/사무",
    "IT개발",
    "데이터",
    "디자인",
    "영업/판매/무역",
    "고객상담/TM",
    "구매/자재/물류",
    "상품기획/MD",
    "운전/운송/배송",
    "서비스",
    "생산",
    "건설/건축",
    "의료",
    "연구/R&D",
    "교육",
    "미디어/문화/스포츠",
    "금융/보험",
    "공공/복지",
]

VALID_TIMELINES = [
    "3개월 이하",
    "6개월 이하",
    "1년 이하",
    "1년 이상",
    "상관없음",
]

VALID_DIFFICULTY_PREFERENCES = [
    "쉬운 편",
    "중간",
    "어려워도 상관없음",
]


class RecommendationRequest(BaseModel):
    """사용자 컨텍스트 기반 추천 요청 스키마."""

    purpose: str = Field(
        ...,
        description="자격증 취득 목적/맥락 (취업, 이직, 전문성 강화, 교양, 창업/실무 활용)",
    )
    interest_domains: list[str] = Field(
        ...,
        min_length=1,
        description="관심 분야 (복수 선택 가능)",
    )
    study_timeline: str = Field(
        ...,
        description="예상 공부 기간 (3개월 이하, 6개월 이하, 1년 이하, 1년 이상, 상관없음)",
    )
    difficulty_preference: str = Field(
        ...,
        description="난이도 선호 (쉬운 편, 중간, 어려워도 상관없음)",
    )
    user_summary: str | None = Field(
        default=None,
        description="사용자가 작성한 한 문장 요약 (선택, 없으면 자동 생성)",
    )

    @field_validator("purpose")
    @classmethod
    def validate_purpose(cls, v: str) -> str:
        if v not in VALID_PURPOSES:
            raise ValueError(
                "Invalid purpose. "
                f"Must be one of: {VALID_PURPOSES}"
            )
        return v

    @field_validator("interest_domains")
    @classmethod
    def validate_interest_domains(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("interest_domains must contain at least one domain")

        invalid = [domain for domain in v if domain not in VALID_INTEREST_DOMAINS]
        if invalid:
            raise ValueError(
                f"Invalid interest_domains: {invalid}. "
                f"Allowed values: {VALID_INTEREST_DOMAINS}"
            )

        # Remove duplicates while preserving order
        seen = set()
        deduped = []
        for domain in v:
            if domain not in seen:
                deduped.append(domain)
                seen.add(domain)
        return deduped

    @field_validator("study_timeline")
    @classmethod
    def validate_timeline(cls, v: str) -> str:
        if v not in VALID_TIMELINES:
            raise ValueError(f"Invalid study_timeline. Must be one of: {VALID_TIMELINES}")
        return v

    @field_validator("difficulty_preference")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        if v not in VALID_DIFFICULTY_PREFERENCES:
            raise ValueError(
                f"Invalid difficulty_preference. Must be one of: {VALID_DIFFICULTY_PREFERENCES}"
            )
        return v

    @field_validator("user_summary")
    @classmethod
    def validate_user_summary(cls, v: str) -> str:
        if v is None:
            return None
        text = v.strip()
        return text or None


class Feasibility(BaseModel):
    """추천 자격증의 준비 가능성 정보."""

    can_prepare: bool = Field(
        ...,
        description="목표 기간 내 준비 가능 여부",
    )
    estimated_days: int = Field(
        ...,
        ge=1,
        description="예상 준비 기간 (일)",
    )


class RecommendedCertificate(BaseModel):
    """추천된 자격증 정보."""

    certificate: Certificate = Field(
        ...,
        description="자격증 상세 정보",
    )
    qualification_category: str = Field(
        ...,
        description="자격 구분명 (국가전문자격, 국가기술자격 등)",
    )
    match_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="사용자 컨텍스트와의 매칭 점수 (0-100)",
    )
    recommendation_reason: str = Field(
        ...,
        description="추천 이유 (2-3문장)",
    )
    key_points: list[str] = Field(
        default_factory=list,
        description="핵심 추천 포인트 (3개)",
    )
    feasibility: Feasibility = Field(
        ...,
        description="준비 가능성 정보",
    )


class RecommendationResponse(BaseModel):
    """추천 결과 응답 스키마."""

    recommendations: list[RecommendedCertificate] = Field(
        default_factory=list,
        description="추천 자격증 목록 (최대 10개)",
    )
    query_summary: str = Field(
        ...,
        description="사용자 요청 요약 (예: 'IT 분야 취업 준비를 위한 자격증 추천')",
    )
    total_matched: int = Field(
        ...,
        ge=0,
        description="조건에 맞는 전체 자격증 수",
    )
