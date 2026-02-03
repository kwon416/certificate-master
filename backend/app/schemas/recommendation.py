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

# 새 필드: 현재 상황
VALID_CURRENT_STATUS = [
    "student",          # 학생 (취업 준비 중인 대학생/취준생)
    "entry_jobseeker",  # 신입 구직자 (첫 직장을 찾고 있어요)
    "junior_worker",    # 현직자 1-3년차 (경력 개발 또는 이직 준비)
    "senior_worker",    # 현직자 4년차 이상 (전문성 강화 또는 커리어 전환)
    "career_break",     # 휴직/전업준비 (재취업 또는 새로운 시작)
]

# 새 필드: 투자 시간
VALID_STUDY_COMMITMENT = [
    "relaxed",    # 여유 있게 (일상과 병행하며 천천히)
    "moderate",   # 적당히 (주 10시간 정도 투자 가능)
    "intensive",  # 집중해서 (전업으로 빠르게 취득 목표)
    "unsure",     # 잘 모르겠어요 (추천받고 결정할게요)
]

# 새 필드: 자격증 등급 선호
VALID_CERTIFICATE_LEVELS = [
    "기능장",      # 기능장 등급 (최고급)
    "기사",        # 기사 등급
    "산업기사",    # 산업기사 등급
    "기능사",      # 기능사 등급 (입문)
    "상관없음",    # 등급 상관없음
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
    current_status: str | None = Field(
        default=None,
        description="현재 상황 (student, entry_jobseeker, junior_worker, senior_worker, career_break)",
    )
    study_commitment: str | None = Field(
        default=None,
        description="투자 시간 (relaxed, moderate, intensive, unsure)",
    )
    target_jobs: list[str] | None = Field(
        default=None,
        description="목표 직종 키워드 (예: ['전기기술자', '전기안전관리자'])",
    )
    target_industries: list[str] | None = Field(
        default=None,
        description="산업 분야 키워드 (예: ['전기공사', '제조업'])",
    )
    certificate_level: str | None = Field(
        default=None,
        description="자격증 등급 선호 (기능장, 기사, 산업기사, 기능사, 상관없음)",
    )
    specific_keywords: list[str] | None = Field(
        default=None,
        description="특정 키워드 (예: ['전기', '정보처리'])",
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

    @field_validator("current_status")
    @classmethod
    def validate_current_status(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if v not in VALID_CURRENT_STATUS:
            raise ValueError(
                f"Invalid current_status. Must be one of: {VALID_CURRENT_STATUS}"
            )
        return v

    @field_validator("study_commitment")
    @classmethod
    def validate_study_commitment(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if v not in VALID_STUDY_COMMITMENT:
            raise ValueError(
                f"Invalid study_commitment. Must be one of: {VALID_STUDY_COMMITMENT}"
            )
        return v

    @field_validator("target_jobs")
    @classmethod
    def validate_target_jobs(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        # 공백만 있는 항목 제거
        filtered = [item.strip() for item in v if item and item.strip()]
        return filtered if filtered else None

    @field_validator("target_industries")
    @classmethod
    def validate_target_industries(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        # 공백만 있는 항목 제거
        filtered = [item.strip() for item in v if item and item.strip()]
        return filtered if filtered else None

    @field_validator("certificate_level")
    @classmethod
    def validate_certificate_level(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if v not in VALID_CERTIFICATE_LEVELS:
            raise ValueError(
                f"Invalid certificate_level. Must be one of: {VALID_CERTIFICATE_LEVELS}"
            )
        return v

    @field_validator("specific_keywords")
    @classmethod
    def validate_specific_keywords(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        # 공백만 있는 항목 제거 및 중복 제거
        seen = set()
        deduped = []
        for item in v:
            if item and item.strip():
                cleaned = item.strip()
                if cleaned not in seen:
                    deduped.append(cleaned)
                    seen.add(cleaned)
        return deduped if deduped else None


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


class QuickStats(BaseModel):
    """핵심 통계 정보."""

    passing_rate: float | None = Field(
        default=None,
        description="합격률 (%)",
    )
    average_salary: str | None = Field(
        default=None,
        description="평균 연봉",
    )
    exam_fee: str | None = Field(
        default=None,
        description="응시료",
    )
    exam_type: str | None = Field(
        default=None,
        description="시험 유형 (필기/실기 등)",
    )


class StudyInsights(BaseModel):
    """학습 인사이트."""

    study_tips: list[str] = Field(
        default_factory=list,
        description="학습 팁 (최대 3개)",
    )
    success_tips: list[str] = Field(
        default_factory=list,
        description="합격 팁 (최대 2개)",
    )
    difficulty_feedback: str | None = Field(
        default=None,
        description="실제 난이도 피드백",
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
        description="핵심 추천 포인트 (최대 5개)",
    )
    feasibility: Feasibility = Field(
        ...,
        description="준비 가능성 정보",
    )
    quick_stats: QuickStats = Field(
        default_factory=QuickStats,
        description="핵심 통계 정보 (합격률, 연봉, 응시료 등)",
    )
    study_insights: StudyInsights = Field(
        default_factory=StudyInsights,
        description="학습 인사이트 (학습 팁, 합격 팁 등)",
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
    user_summary: str | None = Field(
        default=None,
        description="사용자가 입력한 원본 요청 문장 (선택)",
    )
    total_matched: int = Field(
        ...,
        ge=0,
        description="조건에 맞는 전체 자격증 수",
    )
