"""2단계 처리로 자격증 정보 보강을 수행하는 LLM 서비스.

1단계: 검색 결과에서 구조화 데이터 추출
2단계: 추출 데이터 정제 및 보강
"""
import re
import time
from typing import Optional
import json

from openai import AsyncOpenAI, BadRequestError
from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings


# JSON 복구 설정
MAX_RETRIES = 2  # 최대 재시도 횟수


# Phase 1: Extraction Models
class ExtractedExamInfo(BaseModel):
    """검색 결과에서 추출한 시험 정보."""

    subjects: list[str] = Field(default_factory=list)
    exam_type: str = Field(default="")
    passing_criteria: str = Field(default="")
    total_fee: Optional[str] = None  # Changed to str to handle "20,000원", "무료" etc.

    @field_validator("total_fee", mode="before")
    @classmethod
    def coerce_total_fee_to_str(cls, v):
        """숫자 응시료를 문자열로 변환해 검증을 허용합니다."""
        if v is None or isinstance(v, str):
            return v
        return str(v)


# ExamSchedule and Eligibility removed - users should check official sources for these


class ExtractedCareerInfo(BaseModel):
    """추출된 진로 정보."""

    use_cases: list[str] = Field(default_factory=list)
    related_jobs: list[str] = Field(default_factory=list)
    average_salary: Optional[str] = None
    job_prospects: Optional[str] = None
    industry: list[str] = Field(default_factory=list)


class ExtractedUserReviews(BaseModel):
    """추출된 사용자 후기."""

    summary: Optional[str] = None
    difficulty_feedback: Optional[str] = None
    difficulty_breakdown: Optional[dict] = None
    study_period_distribution: Optional[dict] = None
    study_period_range_days: Optional[dict] = None
    study_tips: list[str] = Field(default_factory=list)
    common_challenges: list[str] = Field(default_factory=list)


class ExtractedOfficialSources(BaseModel):
    """추출된 공식 출처."""

    official_site: Optional[str] = None
    issuing_organization: Optional[str] = None
    reference_urls: list[str] = Field(default_factory=list)


class ExtractedLecture(BaseModel):
    """추출된 강의 정보."""

    platform: str
    title: str
    url: str
    instructor: Optional[str] = None
    price: Optional[str] = None  # Changed to str to handle "50만원", "무료" etc.


class ExtractedStudyGuide(BaseModel):
    """추출된 학습 가이드 정보."""

    study_methods: list[str] = Field(default_factory=list)
    learning_sequence: list[str] = Field(default_factory=list)
    time_allocation: Optional[dict] = None
    recommended_books: list[dict] = Field(default_factory=list)
    success_tips: list[str] = Field(default_factory=list)


# ============================================================
# 취업준비생 관점 추출 모델 (NEW: 2026-01-28)
# ============================================================

class ExtractedJobMarketInfo(BaseModel):
    """추출된 채용 시장 정보."""

    job_posting_frequency: Optional[str] = None
    preferred_industries: list[str] = Field(default_factory=list)
    preferred_companies: list[str] = Field(default_factory=list)
    requirement_type: Optional[str] = None
    public_sector_points: Optional[str] = None
    salary_premium: Optional[str] = None


class ExtractedCostBreakdown(BaseModel):
    """추출된 비용 상세 정보."""

    exam_fee: Optional[str] = None
    exam_fee_refund: Optional[str] = None
    textbook_cost: Optional[str] = None
    lecture_cost: Optional[str] = None
    total_estimated_cost: Optional[str] = None
    free_resources: list[str] = Field(default_factory=list)


class ExtractedFeasibilityInfo(BaseModel):
    """추출된 합격 가능성 정보."""

    non_major_pass_rate: Optional[str] = None
    working_adult_tips: list[str] = Field(default_factory=list)
    self_study_possible: Optional[bool] = None
    minimum_study_period: Optional[int] = None
    first_attempt_pass_rate: Optional[str] = None


class ExtractedExamScheduleDetail(BaseModel):
    """추출된 시험 일정 상세 정보."""

    annual_exam_count: Optional[int] = None
    exam_type: Optional[str] = None
    cbt_available: Optional[bool] = None
    next_exam_date: Optional[str] = None
    registration_period: Optional[str] = None
    result_announcement: Optional[str] = None


class ExtractedSimilarCertificate(BaseModel):
    """추출된 유사 자격증 정보."""

    certificate_id: Optional[str] = None
    title: str
    comparison: Optional[str] = None


class Phase1Extraction(BaseModel):
    """1단계: 검색 결과에서 원시 데이터를 추출합니다."""

    overview_draft: str = Field(..., description="초안 개요 (1-2문장)")
    difficulty: int = Field(..., ge=1, le=5)
    study_period_days: int = Field(..., ge=1)
    passing_rate: Optional[float] = Field(None, description="평균 합격률 (%) ⭐NEW")
    exam_info: ExtractedExamInfo
    career_info: ExtractedCareerInfo
    user_reviews: ExtractedUserReviews
    study_guide: ExtractedStudyGuide
    official_sources: ExtractedOfficialSources
    lectures: list[ExtractedLecture] = Field(default_factory=list)
    # 취업준비생 관점 필드 (NEW: 2026-01-28)
    job_market_info: ExtractedJobMarketInfo = Field(default_factory=ExtractedJobMarketInfo)
    cost_breakdown: ExtractedCostBreakdown = Field(default_factory=ExtractedCostBreakdown)
    feasibility_info: ExtractedFeasibilityInfo = Field(default_factory=ExtractedFeasibilityInfo)
    exam_schedule_detail: ExtractedExamScheduleDetail = Field(default_factory=ExtractedExamScheduleDetail)
    similar_certificates: list[ExtractedSimilarCertificate] = Field(default_factory=list)


# Phase 2: Refined Models
class RefinedLecture(BaseModel):
    """관련성 점수를 포함한 정제 강의 정보."""

    platform: str
    title: str
    url: str
    instructor: Optional[str] = None
    price: Optional[str] = None  # Changed to str to handle various formats
    relevance_score: float = Field(..., ge=0, le=1)


class CertificateEnrichment(BaseModel):
    """최종 보강된 자격증 데이터."""

    overview: str = Field(..., description="정제된 개요 (3-5문장)")
    difficulty: int = Field(..., ge=1, le=5)
    study_period_days: int = Field(..., ge=1)
    passing_rate: Optional[float] = Field(None, description="평균 합격률 (%) ⭐NEW")
    exam_info: dict
    career_info: dict
    user_reviews: dict
    study_guide: dict
    official_sources: dict
    recommended_lectures: list[dict] = Field(default_factory=list)  # Optional: 덜 유명한 자격증은 추천 강의 없을 수 있음
    # 취업준비생 관점 필드 (NEW: 2026-01-28)
    job_market_info: dict = Field(default_factory=dict)
    cost_breakdown: dict = Field(default_factory=dict)
    feasibility_info: dict = Field(default_factory=dict)
    exam_schedule_detail: dict = Field(default_factory=dict)
    similar_certificates: list[dict] = Field(default_factory=list)


class LLMService:
    """2단계 처리로 LLM 기반 자격증 보강을 수행하는 서비스.

    OpenAI API (GPT-4o-mini)를 사용합니다.
    """

    def __init__(self, api_key: Optional[str] = None):
        """LLM 서비스를 초기화합니다.

        Args:
            api_key: API 키. 제공되지 않으면 설정 값을 사용합니다.
        """
        settings = get_settings()

        self.provider_name = "openai"
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL_NAME

        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    @staticmethod
    def _try_repair_json(failed_json: str) -> Optional[dict]:
        """잘못된 JSON을 복구 시도합니다.

        Args:
            failed_json: 잘못된 JSON 문자열.

        Returns:
            복구된 딕셔너리 또는 None.
        """
        if not failed_json:
            return None

        try:
            # 1. 먼저 그대로 파싱 시도
            return json.loads(failed_json)
        except json.JSONDecodeError:
            pass

        try:
            # 2. 문자열 내 이스케이프되지 않은 줄바꿈을 \\n으로 변환
            # JSON 문자열 값 내의 실제 줄바꿈을 찾아 이스케이프
            repaired = failed_json

            # 문자열 값 내의 줄바꿈을 \\n으로 변환
            # "key": "value with
            # newline" -> "key": "value with\\nnewline"
            def fix_newlines_in_strings(match):
                content = match.group(1)
                # 실제 줄바꿈을 \\n으로 변환
                fixed = content.replace('\n', '\\n').replace('\r', '\\r')
                return f'"{fixed}"'

            # 따옴표로 둘러싸인 문자열 내용 처리
            repaired = re.sub(r'"([^"\\]*(?:\\.[^"\\]*)*)"', fix_newlines_in_strings, repaired, flags=re.DOTALL)

            return json.loads(repaired)
        except (json.JSONDecodeError, re.error):
            pass

        try:
            # 3. 마지막 중괄호/대괄호가 누락된 경우 추가
            open_braces = repaired.count('{') - repaired.count('}')
            open_brackets = repaired.count('[') - repaired.count(']')

            if open_braces > 0:
                repaired += '}' * open_braces
            if open_brackets > 0:
                repaired += ']' * open_brackets

            return json.loads(repaired)
        except json.JSONDecodeError:
            pass

        return None

    @staticmethod
    def sanitize_recommended_books(books: list[dict]) -> list[dict]:
        """추천 교재를 필터링하고 중복을 제거합니다.

        자리표시 텍스트, 정보 부족 항목, 중복 항목을 제거합니다.

        Args:
            books: 교재 정보 딕셔너리 목록.

        Returns:
            정제된 교재 목록.
        """
        if not books or not isinstance(books, list):
            return []

        # 자리표시 텍스트 (LLM이 정보 없을 때 생성하는 placeholder)
        placeholder_titles = {
            "교재명",
            "책 제목",
            "도서명",
            "추천 교재",
            "교재",
            "기본서",
            "책",
            "수험서",
            "문제집",
            "기출문제집",
            "요약집",
        }

        sanitized = []
        seen_keys = set()

        for book in books:
            if not isinstance(book, dict):
                continue

            title = str(book.get("title") or "").strip()
            publisher = str(book.get("publisher") or "").strip()

            # 필수 필드 검증
            if not title or not publisher:
                continue

            # 자리표시 텍스트 제외
            if title in placeholder_titles:
                continue

            # 중복 제거
            key = (title.casefold(), publisher.casefold())
            if key in seen_keys:
                continue

            seen_keys.add(key)

            # 정제된 교재 추가
            description = str(book.get("description") or "").strip()
            book_type = str(book.get("type") or "").strip()

            sanitized.append({
                "title": title,
                "publisher": publisher,
                "type": book_type or None,
                "description": description or None,
            })

        return sanitized

    async def enrich_certificate(
        self, certificate_title: str, search_context: str
    ) -> CertificateEnrichment:
        """2단계 처리로 자격증 정보를 보강합니다.

        1단계: 검색 결과에서 구조화 데이터 추출
        2단계: 추출 데이터 정제 및 보강

        Args:
            certificate_title: 자격증명.
            search_context: 검색 결과를 포맷한 문자열.
        Returns:
            정제된 데이터가 담긴 CertificateEnrichment.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY not configured")

        # 컨텍스트 길이 계산 (대략적인 토큰 수 추정)
        context_chars = len(search_context)
        context_tokens_est = context_chars // 2  # 한글 기준 대략 2자당 1토큰

        print(f"    [LLM] provider={self.provider_name}, model={self.model}")
        print(f"    [LLM] 입력 컨텍스트: {context_chars}자 (~{context_tokens_est} tokens)")

        # Phase 1: Extract
        print(f"    [Phase 1] Extracting data... (model: {self.model})")
        start_time = time.time()
        extracted = await self._phase1_extract(certificate_title, search_context)
        phase1_time = time.time() - start_time
        print(f"    [Phase 1] 완료 ({phase1_time:.1f}초)")

        # Phase 2: Refine
        print(f"    [Phase 2] Refining data... (model: {self.model})")
        start_time = time.time()
        enriched = await self._phase2_refine(certificate_title, extracted)
        phase2_time = time.time() - start_time
        print(f"    [Phase 2] 완료 ({phase2_time:.1f}초)")

        return enriched

    async def _phase1_extract(
        self, certificate_title: str, search_context: str
    ) -> Phase1Extraction:
        """1단계: 검색 결과에서 구조화된 데이터를 추출합니다.

        Args:
            certificate_title: 자격증명.
            search_context: 검색 결과를 포맷한 문자열.
        """

        system_prompt = """당신은 한국 자격증 정보 추출 및 설명 전문가입니다.
검색 결과에서 정확한 정보만 추출하세요. 정보가 없으면 빈 값으로 두세요.
검색 결과 외의 텍스트나 사전 지식은 절대 사용하지 마세요.

자격증명: {certificate_title}

추출 규칙:
1. 검색 결과에 명시된 내용만 추출 (특히 url_quality 높은 것 우선)
2. 공식 사이트(.go.kr, q-net.or.kr) 정보 우선 사용
3. URL은 검색 결과의 실제 URL을 그대로 사용
4. 강의는 실제 강의 플랫폼(eduwill.net, hackers.com 등)만 선택
5. 커뮤니티/블로그 추천글은 강의 목록에서 제외

**합격률 추출 규칙** ⭐NEW:
- "2. 합격률 및 준비기간 통계" 카테고리 우선 참고
- 공식 통계(q-net, .go.kr) 우선 사용
- 최근 3년(2023-2025) 평균 합격률 추출
- 합격률 추이를 exam_info.pass_rate_trend에 포함
  예: "2023년 45%, 2024년 48%, 2025년 50% (상승 추세)"
- 불확실하면 passing_rate: null

**준비 기간 추출 규칙** ⭐NEW:
- "2. 합격률 및 준비기간 통계" 및 "5. 합격 후기 및 팁" 카테고리 참고
- 실제 합격자들의 준비기간 수집 (1개월, 3개월, 6개월 등)
- 가장 많이 언급된 기간을 study_period_days로 설정
- 준비기간 분포를 user_reviews.study_period_distribution에 구조화해 포함
  예: {"1개월 이하": "20%", "1-3개월": "35%", "3-6개월": "30%", "6-12개월": "10%", "1년 이상": "5%"}
- 준비기간 범위를 user_reviews.study_period_range_days에 포함
  예: {"min": 30, "median": 120, "max": 365}
- 공식 권장 기간이 있으면 우선 사용

**난이도 추출 규칙** ⭐NEW:
- overall 난이도는 1-5 유지
- 필기/실기/면접 구분이 있으면 각각 난이도를 추정해 user_reviews.difficulty_breakdown에 포함
  예: {"overall": 3, "written": 2, "practical": 4, "interview": null}
- 난이도 근거를 user_reviews.difficulty_feedback에 2-3문장으로 서술

**시험 정보 추출 강화**:
- 시험 과목, 문항 수, 시험 시간, 시험 방식 (CBT/OMR)
- 과목별 배점, 합격 기준 (평균 60점 이상 등)
- 필기/실기 구분, 각 시험의 난이도 차이
- 최근 출제 경향, 자주 나오는 주제

**학습 가이드 추출 강화**:
- 실제 합격자들의 구체적인 공부 방법
- 주차별 학습 계획 예시 (1주차: 이론 1-3장, 2주차: 기출문제 등)
- 교재별 특징 및 장단점
- 공부 시간대, 집중력 관리 방법
- 취약 과목 극복 방법
**추천 교재 추출 규칙**:
- "추천 교재" 카테고리에 명시된 교재만 사용
- 교재명과 출판사가 모두 확인될 때만 포함
- 정보가 부족하면 recommended_books를 빈 배열로 반환
- "교재명", "책 제목" 같은 자리표시는 절대 사용하지 않음

**후기 추출 강화**:
- 시험장에서 주의할 점 (시간 배분, 순서 등)
- 공부하면서 겪는 구체적인 어려움과 해결책
- 시험 전날/당일 준비사항
- 멘탈 관리, 슬럼프 극복 방법
- 합격 후 실무에서 활용하는 팁

**연봉 정보 추출 규칙**:
- 공식 통계 또는 신뢰할 수 있는 뉴스 출처만
- 범위로 표시 (예: "연 3,000만원 ~ 5,000만원")
- 불확실하면 null

**공식 출처 정보**:
- official_site: 시험 일정, 접수 공지를 확인할 수 있는 공식 사이트
- reference_urls에 시험 일정 페이지 URL 포함
- 사용자는 이 링크를 통해 최신 일정을 확인해야 함

**[취업준비생 관점 정보 추출 규칙]** ⭐NEW:

1. **채용 시장 정보 (job_market_info)**:
   - "8. 채용공고 정보" 카테고리 참고
   - job_posting_frequency: 채용공고 출현 빈도 ("매우 많음", "많음", "보통", "적음")
   - preferred_industries: 이 자격증을 선호하는 산업군 (예: ["IT", "금융", "제조"])
   - preferred_companies: 우대하는 기업 예시 (예: ["삼성", "SK", "네이버"])
   - requirement_type: 채용 시 자격증 요건 유형 ("필수", "우대", "가산점")
   - public_sector_points: 공무원/공기업 가산점 (예: "5%", "3점")
   - salary_premium: 연봉 가산 효과 (예: "월 10-20만원 수당")

2. **비용 상세 (cost_breakdown)**:
   - "10. 비용 정보" 카테고리 참고
   - exam_fee: 응시료 (예: "필기 19,400원 + 실기 22,600원")
   - exam_fee_refund: 환불 정책 (예: "시험 3일 전까지 100% 환불")
   - textbook_cost: 교재 비용 범위 (예: "30,000 ~ 50,000원")
   - lecture_cost: 인강 비용 범위 (예: "100,000 ~ 300,000원")
   - total_estimated_cost: 총 예상 비용 (예: "150,000 ~ 400,000원")
   - free_resources: 무료 학습 자료 (예: ["큐넷 기출문제", "유튜브 무료 강의"])

3. **합격 가능성 정보 (feasibility_info)**:
   - "11. 비전공자 합격 후기" 카테고리 참고
   - non_major_pass_rate: 비전공자 합격률 추정 (예: "약 30-35%")
   - working_adult_tips: 직장인 합격 팁 (예: ["출퇴근 시간 활용", "CBT 상시 응시"])
   - self_study_possible: 독학 가능 여부 (true/false)
   - minimum_study_period: 최소 합격 준비기간 (일 단위, 예: 30)
   - first_attempt_pass_rate: 1회 합격 비율 (예: "약 40%")

4. **시험 일정 상세 (exam_schedule_detail)**:
   - exam_info와 별도로 일정 관련 상세 정보
   - annual_exam_count: 연간 시험 횟수 (예: 3)
   - exam_type: 시험 유형 ("CBT", "정기", "CBT+정기")
   - cbt_available: CBT 상시 가능 여부 (true/false)
   - next_exam_date: 다음 시험일 예상 (검색 결과에 있으면)
   - registration_period: 접수 기간 (검색 결과에 있으면)
   - result_announcement: 합격 발표일 (예: "시험 후 2주 내")

5. **유사 자격증 비교 (similar_certificates)**:
   - "13. 비교 정보" 카테고리 참고
   - 같은 분야의 비슷한 자격증과 비교
   - title: 유사 자격증명 (예: "정보처리산업기사")
   - comparison: 비교 설명 (예: "기사보다 난이도 낮음, 실무 경력 대신 취득 가능")

난이도 기준:
- 1: 1-2주 소요, 누구나 쉽게 합격 가능
- 2: 1-2개월 소요, 기초 지식으로 합격 가능
- 3: 3-6개월 소요, 체계적 학습 필요
- 4: 6개월-1년 소요, 전문 지식 및 집중 학습 필요
- 5: 1년 이상 소요, 매우 높은 난이도, 장기 준비 필수

출력은 반드시 유효한 JSON 형식으로 작성하세요.
**중요: JSON 문자열 내 줄바꿈은 반드시 \\n 이스케이프 시퀀스를 사용하세요. 실제 줄바꿈 문자를 사용하면 안 됩니다.**

{{
  "overview_draft": "1-2문장 초안 (줄바꿈 필요시 \\n 사용)",
  "difficulty": 1-5,
  "study_period_days": 일수 (실제 합격자 평균 준비기간),
  "passing_rate": 평균 합격률(%) 또는 null (예: 45.5),
  "exam_info": {{
    "subjects": ["과목1 (문항수, 시간)", "과목2 (문항수, 시간)", ...],
    "exam_type": "필기/실기/필기+실기/면접 (CBT/OMR/실기)",
    "passing_criteria": "합격 기준 (평균 60점 이상, 과목당 40점 이상 등)",
    "total_fee": 응시료 또는 null,
    "exam_structure": "시험 구성 설명 (예: 필기 100문항 2시간 30분, 실기 4시간 등)",
    "recent_trends": "최근 출제 경향 (예: 최신 기술 동향 반영, 실무 위주 출제 등)",
    "pass_rate_trend": "합격률 추이 (예: 2023년 45%, 2024년 48%, 2025년 50% - 상승 추세) 또는 null"
  }},
  "career_info": {{
    "use_cases": ["활용 분야1", "활용 분야2", ...],
    "related_jobs": ["관련 직업1", "관련 직업2", ...],
    "average_salary": "평균 연봉 범위 (예: 연 3,000만원 ~ 5,000만원)",
    "job_prospects": "취업 전망 2-3문장 서술 (현재 상황, 향후 전망, 구체적 이유 포함)",
    "industry": ["관련 산업1", "관련 산업2", ...]
  }},
  "user_reviews": {{
    "summary": "합격자 후기 요약 1-2문단 서술 (전반적 평가, 구체적 사례, 공통 의견, 준비기간 분포 포함. 예: '대부분 3-6개월 준비하며, 일부는 1개월 만에 합격하기도 함')",
    "difficulty_feedback": "난이도 평가 1-2문장 서술 (체감 난이도와 그 이유)",
    "difficulty_breakdown": {{"overall": 3, "written": 2, "practical": 4, "interview": null}},
    "study_period_distribution": {{"1개월 이하": "20%", "1-3개월": "35%", "3-6개월": "30%", "6-12개월": "10%", "1년 이상": "5%"}},
    "study_period_range_days": {{"min": 30, "median": 120, "max": 365}},
    "study_tips": [
      "기출문제를 최소 3회 이상 반복해서 풀면 정답률이 90% 이상으로 올라갑니다.",
      "시험장에서 어려운 문제가 나오면 표시해두고 나중에 다시 풀어보는 것이 시간 관리에 효과적입니다.",
      "오답노트를 작성하면서 틀린 이유를 분석하고 개념을 다시 정리하면 같은 실수를 방지할 수 있습니다."
    ],
    "common_challenges": [
      "방대한 학습 분량이 부담스러울 수 있는데, 주차별 학습 계획을 세우고 매일 진도를 체크하면 효과적으로 관리할 수 있습니다.",
      "시험 당일 긴장감으로 실력 발휘가 어려울 수 있으므로, 시험 전 심호흡을 하고 편안한 옷을 착용하는 것이 도움됩니다.",
      "암기 과목이 많아 지치기 쉬운데, 반복 학습과 연상 기억법을 활용하면 효율적으로 암기할 수 있습니다."
    ],
    "exam_day_tips": [
      "시험 전날에는 새로운 내용을 학습하지 말고 그동안 공부한 핵심 개념만 가볍게 복습하세요.",
      "시험 당일에는 신분증, 수험표, 필기구를 반드시 챙기고 여유 있게 시험장에 도착하세요.",
      "시험 중 긴장되면 잠시 눈을 감고 심호흡을 3회 정도 하면 마음이 안정됩니다."
    ]
  }},
  "study_guide": {{
    "study_methods": [
      "방법1: 구체적 설명 (예: 교재 1회독 후 기출문제 풀이)",
      "방법2: 실제 합격자 방법 (예: 강의 1.5배속 수강 후 요약 노트 작성)",
      ...
    ],
    "learning_sequence": [
      "1단계 (1-2주): 기초 개념 학습 - 교재 1-3장, 기본 용어 암기",
      "2단계 (2-3주): 심화 학습 - 교재 4-6장, 응용 문제 풀이",
      "3단계 (1-2주): 기출문제 분석 - 최근 5개년 기출 3회 반복",
      "4단계 (1주): 모의고사 - 실전처럼 3회 이상, 취약 과목 집중",
      "5단계 (3일): 최종 정리 - 오답노트 복습, 핵심 개념 재암기",
      ...
    ],
    "time_allocation": {{
      "theory": "30% (이론 학습, 개념 이해)",
      "practice": "60% (기출문제, 모의고사 풀이)",
      "review": "10% (오답 복습, 취약 과목 보강)"
    }},
    "recommended_books": [
      {{
        "title": "정보처리기사 필기",
        "publisher": "출판사",
        "type": "필기/실기/종합",
        "description": "교재 특징 및 장단점 (예: 설명이 자세하나 두꺼움, 요약 위주로 빠른 학습 가능 등)"
      }}
    ],
    "success_tips": [
      "기출문제를 3회 이상 반복해서 풀고, 정답률 90%를 목표로 학습하면 실전에서 자신감이 생깁니다.",
      "틀린 문제는 오답노트에 정리하고 왜 틀렸는지 분석한 뒤 다시 풀어보면 같은 유형에서 실수를 줄일 수 있습니다.",
      "스터디 그룹을 만들어 주 1회 모의고사를 함께 풀고 토론하면 혼자 공부할 때 놓치는 부분을 보완할 수 있습니다.",
      "50분 공부 후 10분 휴식하는 패턴으로 집중력을 유지하고, 오전 시간대에 어려운 과목을 공부하면 효율이 높아집니다.",
      "취약 과목에는 다른 과목보다 2배 이상의 시간을 투자하여 평균 점수 이상으로 끌어올리는 것이 합격의 핵심입니다."
    ]
  }},
  "official_sources": {{
    "official_site": "시험 일정 및 접수를 확인할 수 있는 공식 사이트 URL (필수)",
    "issuing_organization": "발급 기관",
    "reference_urls": [
      "시험 일정 공지 페이지 URL",
      "시험 접수 페이지 URL",
      "기출문제 다운로드 URL",
      ...
    ]
  }},
  "lectures": [
    {{
      "platform": "플랫폼명",
      "title": "강의명 (반드시 {certificate_title} 관련)",
      "url": "검색 결과의 실제 URL",
      "instructor": "강사명 또는 null",
      "price": "가격 문자열 (예: '150000원', '무료', '50만원') 또는 null"
    }}
  ],
  "job_market_info": {{
    "job_posting_frequency": "채용공고 빈도 ('매우 많음', '많음', '보통', '적음') 또는 null",
    "preferred_industries": ["선호 산업1", "선호 산업2", ...],
    "preferred_companies": ["우대 기업1", "우대 기업2", ...],
    "requirement_type": "채용 요건 유형 ('필수', '우대', '가산점') 또는 null",
    "public_sector_points": "공무원/공기업 가산점 또는 null",
    "salary_premium": "연봉/수당 가산 효과 또는 null"
  }},
  "cost_breakdown": {{
    "exam_fee": "응시료 (예: '필기 19,400원 + 실기 22,600원')",
    "exam_fee_refund": "환불 정책 또는 null",
    "textbook_cost": "교재 비용 범위 또는 null",
    "lecture_cost": "인강 비용 범위 또는 null",
    "total_estimated_cost": "총 예상 비용 또는 null",
    "free_resources": ["무료 자료1", "무료 자료2", ...]
  }},
  "feasibility_info": {{
    "non_major_pass_rate": "비전공자 합격률 추정 또는 null",
    "working_adult_tips": ["직장인 팁1", "직장인 팁2", ...],
    "self_study_possible": true/false 또는 null,
    "minimum_study_period": 최소 준비기간(일) 또는 null,
    "first_attempt_pass_rate": "1회 합격 비율 또는 null"
  }},
  "exam_schedule_detail": {{
    "annual_exam_count": 연간 시험 횟수 또는 null,
    "exam_type": "시험 유형 ('CBT', '정기', 'CBT+정기') 또는 null",
    "cbt_available": true/false 또는 null,
    "next_exam_date": "다음 시험일 또는 null",
    "registration_period": "접수 기간 또는 null",
    "result_announcement": "합격 발표일 또는 null"
  }},
  "similar_certificates": [
    {{
      "title": "유사 자격증명",
      "comparison": "비교 설명 (예: '기사보다 난이도 낮음')"
    }}
  ]
}}
"""
        system_prompt = system_prompt.replace("{{", "{").replace("}}", "}")
        system_prompt = system_prompt.replace("{certificate_title}", certificate_title)

        user_prompt = search_context

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2 + (attempt * 0.1),  # 재시도 시 온도 약간 증가
                )

                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Empty response from LLM (Phase 1)")

                data = json.loads(content)
                study_guide = data.get("study_guide", {})
                if isinstance(study_guide, dict):
                    books = study_guide.get("recommended_books", [])
                    study_guide["recommended_books"] = self.sanitize_recommended_books(books)
                return Phase1Extraction(**data)

            except BadRequestError as e:
                last_error = e
                # JSON 검증 실패 시 failed_generation에서 복구 시도
                error_body = getattr(e, 'body', {}) or {}
                if isinstance(error_body, dict):
                    failed_gen = error_body.get('error', {}).get('failed_generation', '')
                    if failed_gen:
                        print(f"    [Phase 1] JSON 복구 시도 중... (시도 {attempt + 1}/{MAX_RETRIES + 1})")
                        repaired_data = self._try_repair_json(failed_gen)
                        if repaired_data:
                            try:
                                study_guide = repaired_data.get("study_guide", {})
                                if isinstance(study_guide, dict):
                                    books = study_guide.get("recommended_books", [])
                                    study_guide["recommended_books"] = self.sanitize_recommended_books(books)
                                return Phase1Extraction(**repaired_data)
                            except Exception:
                                pass  # 복구 실패, 재시도
                if attempt < MAX_RETRIES:
                    print(f"    [Phase 1] 재시도 중... ({attempt + 2}/{MAX_RETRIES + 1})")
                    continue
                raise last_error

            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES:
                    print(f"    [Phase 1] 오류 발생, 재시도 중... ({attempt + 2}/{MAX_RETRIES + 1}) [model: {self.model}]")
                    continue
                raise last_error

        raise last_error or ValueError("Unknown error in Phase 1")

    async def _phase2_refine(
        self, certificate_title: str, extracted: Phase1Extraction
    ) -> CertificateEnrichment:
        """2단계: 추출 데이터를 정제하고 보강합니다."""

        system_prompt = f"""당신은 한국 자격증 정보 정제 전문가입니다.
추출된 정보를 바탕으로 살을 붙이고 완성도를 높이세요.

자격증명: {certificate_title}

정제 규칙:
1. **서술형 작성**: 단답형 절대 금지, 읽기 쉬운 문장으로
2. **JSON 줄바꿈**: 문자열 내 줄바꿈은 반드시 \\n 이스케이프 시퀀스 사용 (실제 엔터 금지)
3. overview: 3-5문장, 문장 사이에 \\n 삽입
4. job_prospects: 2-3문장, 문장 사이에 \\n 삽입
5. user_reviews.summary: 1-2문단, 문단 사이에 \\n\\n 삽입
6. 강의는 실제 강의 사이트만 (커뮤니티 제외)
7. 관련성 점수 0.5 미만 제외

**시험 정보 강화 규칙**:
- exam_structure: 필기/실기 구성, 총 문항수, 시험 시간 명시
- subjects: 각 과목명에 문항수 및 시간 추가 (예: "소프트웨어 설계 (20문항, 30분)")
- recent_trends: 최근 3년간 출제 경향 분석, 자주 나오는 주제 3가지 이상

**학습 가이드 강화 규칙**:
- study_methods: 실제 합격자들의 구체적인 방법 5가지 이상
- learning_sequence: 주차별 세부 계획 (1-2주 단위), 각 단계에 기간 및 목표 명시
- success_tips: 구체적이고 실행 가능한 팁 7가지 이상
**추천 교재 규칙**:
- 교재명과 출판사 정보가 명확한 경우에만 포함
- 정보가 부족하면 recommended_books는 빈 배열

**후기 강화 규칙**:
- study_tips: 실전 팁 포함 (시험장 노하우, 시간 배분 전략)
- common_challenges: 각 어려움에 대한 구체적 해결책 포함
- exam_day_tips 필수: 시험 전날, 당일 준비사항 3가지 이상
- difficulty_breakdown, study_period_distribution, study_period_range_days는 구조 유지

**공식 출처 필수 규칙**:
- official_site: 반드시 포함, 시험 일정 및 접수 확인 가능한 링크
- reference_urls: 시험 일정 공지 페이지 URL 최우선 포함

**연봉 정보 규칙**:
- 구체적 범위 (예: "연 3,000만원 ~ 5,000만원"), 불확실하면 null

**[취업준비생 관점 정제 규칙]** ⭐NEW:

1. **채용 시장 정보 (job_market_info)**:
   - job_posting_frequency: 구체적 빈도 ("매우 많음", "많음", "보통", "적음")
   - preferred_industries: 최소 3개 이상의 산업군 나열
   - preferred_companies: 실제 채용 우대 기업 5개 이상 (대기업/공기업 위주)
   - requirement_type: "필수", "우대", "가산점" 중 가장 일반적인 유형
   - public_sector_points: 공무원/공기업 가산점 구체적으로 (예: "필기 5점, 면접 3점")
   - salary_premium: 월급/연봉 가산 효과 구체적 범위 (예: "월 10-30만원 자격수당")

2. **비용 상세 (cost_breakdown)**:
   - exam_fee: 필기+실기 각각 분리해서 명시 (예: "필기 19,400원 + 실기 22,600원")
   - total_estimated_cost: 최소-최대 범위로 명시 (예: "150,000 ~ 400,000원")
   - free_resources: 무료 학습 자료 최소 3개 이상 (유튜브, 큐넷, 블로그 등)

3. **합격 가능성 정보 (feasibility_info)**:
   - non_major_pass_rate: 비전공자 합격률 범위 (예: "약 25-35%")
   - working_adult_tips: 직장인 특화 팁 최소 3개 이상 (시간 활용법, CBT 전략 등)
   - self_study_possible: 독학 가능 여부와 근거 포함
   - minimum_study_period: 최소 준비기간 일수 (빠른 합격자 기준)

4. **시험 일정 상세 (exam_schedule_detail)**:
   - annual_exam_count: 정확한 연간 횟수
   - exam_type: CBT/정기/상시 구분 명확히
   - cbt_available: CBT 상시 가능 여부 명확히

5. **유사 자격증 비교 (similar_certificates)**:
   - 같은 분야 자격증 2-3개 비교
   - comparison: 난이도, 활용도, 준비기간 차이 설명

강의 관련성 점수 기준:
- 1.0: 제목에 자격증명 정확히 포함 + 신뢰할 수 있는 플랫폼
- 0.8-0.9: 제목에 자격증명 유사 포함 + 신뢰할 수 있는 플랫폼
- 0.5-0.7: 제목에 자격증명 일부 포함
- 0.0-0.4: 다른 자격증 또는 관련 없음 (제외)

출력은 반드시 유효한 JSON 형식으로 작성하세요.
**중요: JSON 문자열 내 줄바꿈은 반드시 \\n 이스케이프 시퀀스를 사용하세요. 실제 줄바꿈 문자를 사용하면 안 됩니다.**

예시:
{{
  "overview": "세무사는 세무 관련 전문가입니다.\\n이 자격증은 세무 업무에 필수적입니다.\\n기업과 개인의 세무 관리를 담당합니다.",
  "difficulty": 3,
  "study_period_days": 180,
  "passing_rate": 45.5,
  "exam_info": {{
    "subjects": ["세법학 1부 (25문항, 50분)", "세법학 2부 (25문항, 50분)"],
    "exam_type": "필기 (CBT)",
    "passing_criteria": "평균 60점 이상, 과목당 40점 이상",
    "total_fee": "100000",
    "exam_structure": "1차 필기 100문항 2시간 30분, 2차 실무 4과목 각 2시간",
    "recent_trends": "최근 3년간 세법 개정 내용 출제 빈도 증가, 실무 사례 중심 문제 출제",
    "pass_rate_trend": "2023년 15%, 2024년 18%, 2025년 20% - 상승 추세"
  }},
  "career_info": {{
    "use_cases": ["세무법인", "회계법인", "기업 세무팀"],
    "related_jobs": ["세무사", "회계사", "세무 컨설턴트"],
    "average_salary": "연 3,000만원 ~ 5,000만원",
    "job_prospects": "현재 세무사 수요는 꾸준합니다.\\n세법 개정으로 인해 향후 전망이 밝습니다.\\n중소기업 대상 시장이 확대되고 있습니다.",
    "industry": ["세무", "회계", "금융"]
  }},
  "user_reviews": {{
    "summary": "합격자들은 난이도가 높다고 평가합니다.\\n\\n실제 합격자들은 1-2년의 준비 기간을 권장합니다.",
    "difficulty_feedback": "난이도가 매우 높습니다.\\n방대한 학습량과 복잡한 세법이 주요 원인입니다.",
    "difficulty_breakdown": {{"overall": 5, "written": 4, "practical": 5, "interview": null}},
    "study_period_distribution": {{"3-6개월": "10%", "6-12개월": "30%", "1년 이상": "60%"}},
    "study_period_range_days": {{"min": 90, "median": 365, "max": 730}},
    "study_tips": [
      "기출문제를 3회 이상 반복해서 풀면 정답률 90% 이상 도달이 가능하며, 자주 출제되는 유형을 파악할 수 있습니다.",
      "시험장에서 어려운 문제가 나오면 표시해두고 나중에 다시 풀면 시간 관리에 효과적입니다.",
      "오답노트를 작성하면서 틀린 이유를 분석하고 개념을 다시 정리하면 같은 실수를 방지할 수 있습니다."
    ],
    "common_challenges": [
      "방대한 학습 분량이 부담스러울 수 있는데, 주차별 학습 계획을 세우고 매일 진도를 체크하면 효과적으로 관리할 수 있습니다.",
      "시험 당일 긴장감으로 실력 발휘가 어려울 수 있으므로, 시험 전날 충분히 수면을 취하고 당일 간단한 스트레칭을 하면 도움됩니다.",
      "암기 과목이 많아 지치기 쉬운데, 반복 학습과 연상 기억법을 활용하면 효율적으로 암기할 수 있습니다."
    ],
    "exam_day_tips": [
      "시험 전날에는 새로운 내용을 학습하지 말고 그동안 공부한 핵심 개념만 가볍게 복습하세요.",
      "시험 당일에는 계산기, 신분증, 수험표를 반드시 챙기고 여유 있게 시험장에 도착하세요.",
      "시험 중 긴장되면 잠시 눈을 감고 심호흡을 3회 정도 하면서 긍정적인 자기 암시를 해보세요."
    ]
  }},
  "study_guide": {{
    "study_methods": [
      "교재를 3회 반복해서 학습하면 효과적인데, 1회독은 이해 위주로, 2회독은 암기 위주로, 3회독은 정리 위주로 진행하세요.",
      "기출문제를 중심으로 학습하면서 최근 5개년 문제를 3회 반복해서 풀면 출제 경향을 파악할 수 있습니다.",
      "강의를 1.5배속으로 수강한 후 요약 노트를 작성하면 복습 시간을 단축할 수 있습니다.",
      "스터디 그룹을 만들어 주 1회 모의고사를 함께 풀고 취약 과목에 대해 토론하면 혼자 공부할 때 놓치는 부분을 보완할 수 있습니다.",
      "온라인 무료 강의를 활용하면 비용을 절감하면서 복습용으로 효과적으로 사용할 수 있습니다."
    ],
    "learning_sequence": [
      "1단계 (1-2주): 기초 개념 학습 - 교재 1-3장, 기본 용어 암기, 이론 위주",
      "2단계 (2-3주): 심화 학습 - 교재 4-6장, 응용 문제 풀이",
      "3단계 (1-2주): 기출문제 분석 - 최근 5개년 기출 3회 반복",
      "4단계 (1주): 모의고사 - 실전처럼 3회 이상, 취약 과목 집중",
      "5단계 (3일): 최종 정리 - 오답노트 복습, 핵심 개념 재암기"
    ],
    "time_allocation": {{
      "theory": "30% (이론 학습, 개념 이해)",
      "practice": "60% (기출문제, 모의고사 풀이)",
      "review": "10% (오답 복습, 취약 과목 보강)"
    }},
    "recommended_books": [
      {{
        "title": "세무사 1차 필기",
        "publisher": "에듀윌",
        "type": "필기",
        "description": "설명이 자세하나 두꺼움, 초보자 추천"
      }},
      {{
        "title": "세무사 요약집",
        "publisher": "해커스",
        "type": "종합",
        "description": "요약 위주로 빠른 학습 가능, 2-3회독 후 사용 권장"
      }}
    ],
    "success_tips": [
      "기출문제를 3회 이상 반복해서 풀고, 정답률 90%를 목표로 학습하면 실전에서 자신감이 생깁니다.",
      "틀린 문제는 오답노트에 정리하고 왜 틀렸는지 분석한 뒤 다시 풀어보면 같은 유형에서 실수를 줄일 수 있습니다.",
      "스터디 그룹을 만들어 주 1회 모의고사를 함께 풀고 토론하면 혼자 공부할 때 놓치는 부분을 보완할 수 있습니다.",
      "50분 공부 후 10분 휴식하는 패턴으로 집중력을 유지하고, 오전 시간대에 어려운 과목을 공부하면 효율이 높아집니다.",
      "취약 과목에는 다른 과목보다 2배 이상의 시간을 투자하여 평균 점수 이상으로 끌어올리는 것이 합격의 핵심입니다.",
      "슬럼프가 올 때는 1-2일 정도 쉬면서 리프레시한 후 다시 공부를 시작하면 효율이 더 좋아집니다.",
      "시험 2주 전부터는 실제 시험 시간에 맞춰 모의고사를 풀면서 실전 감각을 익히는 것이 중요합니다."
    ]
  }},
  "official_sources": {{
    "official_site": "https://www.q-net.or.kr (시험 일정 및 접수 확인)",
    "issuing_organization": "한국산업인력공단",
    "reference_urls": [
      "https://www.q-net.or.kr/site/tax/schedule.do (시험 일정 공지)",
      "https://www.q-net.or.kr/site/tax/apply.do (시험 접수)",
      "https://www.q-net.or.kr/site/tax/pastexam.do (기출문제 다운로드)"
    ]
  }},
  "recommended_lectures": [...],
  "job_market_info": {{
    "job_posting_frequency": "많음",
    "preferred_industries": ["세무법인", "회계법인", "금융업", "대기업 재무팀", "공기업"],
    "preferred_companies": ["삼일회계법인", "삼정KPMG", "딜로이트", "국세청", "국민은행"],
    "requirement_type": "우대",
    "public_sector_points": "국세청 5%, 지방세 담당 공무원 가산점",
    "salary_premium": "세무법인 근무 시 월 20-50만원 수당"
  }},
  "cost_breakdown": {{
    "exam_fee": "1차 필기 30,000원 + 2차 실무 50,000원 = 총 80,000원",
    "exam_fee_refund": "시험 7일 전까지 100% 환불 가능",
    "textbook_cost": "50,000 ~ 150,000원 (기본서 + 문제집)",
    "lecture_cost": "300,000 ~ 1,500,000원 (인강 1년 기준)",
    "total_estimated_cost": "500,000 ~ 2,000,000원",
    "free_resources": ["큐넷 기출문제", "유튜브 세무사 강의", "국세청 세법 자료"]
  }},
  "feasibility_info": {{
    "non_major_pass_rate": "약 15-20% (전체 합격률보다 낮음)",
    "working_adult_tips": [
      "출퇴근 시간에 인강 1.5배속 청취로 하루 2시간 확보",
      "주말 집중 학습 (토 8시간, 일 6시간)",
      "세법 개정 요약본으로 효율적 학습"
    ],
    "self_study_possible": false,
    "minimum_study_period": 365,
    "first_attempt_pass_rate": "약 10%"
  }},
  "exam_schedule_detail": {{
    "annual_exam_count": 1,
    "exam_type": "정기시험 (연 1회)",
    "cbt_available": false,
    "next_exam_date": "매년 5월 (1차), 8월 (2차)",
    "registration_period": "3월 중",
    "result_announcement": "1차: 6월, 2차: 11월"
  }},
  "similar_certificates": [
    {{
      "title": "공인회계사(CPA)",
      "comparison": "세무사보다 난이도 높음, 회계 감사 업무 가능, 준비기간 2-3년"
    }},
    {{
      "title": "세무회계 1급",
      "comparison": "세무사보다 난이도 낮음, 민간자격, 실무 입문용으로 적합"
    }},
    {{
      "title": "전산세무 1급",
      "comparison": "실무 중심 자격증, 세무사 준비 전 실습용으로 좋음"
    }}
  ]
}}

**핵심 규칙**:
1. **JSON 문자열 내 줄바꿈은 반드시 \\n 이스케이프 시퀀스 사용** (실제 줄바꿈 문자 금지)
2. exam_info는 구체적으로 (문항수, 시간, 출제 경향)
3. study_guide는 실행 가능하도록 (주차별 계획, 구체적 방법)
4. user_reviews.exam_day_tips 필수 (시험 전날, 당일, 멘탈 관리)
5. official_sources.reference_urls에 시험 일정 페이지 필수 포함
6. job_prospects는 3문장, \\n으로 구분
7. user_reviews.summary는 문단 2개, \\n\\n으로 구분
8. 모든 필드 값이 완전한 JSON 문자열로 닫혀 있는지 확인
"""

        user_prompt = f"""추출된 데이터:
{extracted.model_dump_json(indent=2)}

위 데이터를 정제하고 완성도를 높여주세요.
특히 overview를 3-5문장으로 확장하고, 강의는 관련성 점수를 계산하여 0.5 미만은 제외하세요.
**중요: 모든 문자열 값은 유효한 JSON 형식이어야 합니다. 줄바꿈은 \\n을 사용하세요.**"""

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3 + (attempt * 0.1),  # 재시도 시 온도 약간 증가
                )

                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Empty response from LLM (Phase 2)")

                data = json.loads(content)
                study_guide = data.get("study_guide", {})
                if isinstance(study_guide, dict):
                    books = study_guide.get("recommended_books", [])
                    study_guide["recommended_books"] = self.sanitize_recommended_books(books)
                return CertificateEnrichment(**data)

            except BadRequestError as e:
                last_error = e
                # JSON 검증 실패 시 failed_generation에서 복구 시도
                error_body = getattr(e, 'body', {}) or {}
                if isinstance(error_body, dict):
                    failed_gen = error_body.get('error', {}).get('failed_generation', '')
                    if failed_gen:
                        print(f"    [Phase 2] JSON 복구 시도 중... (시도 {attempt + 1}/{MAX_RETRIES + 1})")
                        repaired_data = self._try_repair_json(failed_gen)
                        if repaired_data:
                            try:
                                study_guide = repaired_data.get("study_guide", {})
                                if isinstance(study_guide, dict):
                                    books = study_guide.get("recommended_books", [])
                                    study_guide["recommended_books"] = self.sanitize_recommended_books(books)
                                return CertificateEnrichment(**repaired_data)
                            except Exception:
                                pass  # 복구 실패, 재시도
                if attempt < MAX_RETRIES:
                    print(f"    [Phase 2] 재시도 중... ({attempt + 2}/{MAX_RETRIES + 1})")
                    continue
                raise last_error

            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES:
                    print(f"    [Phase 2] 오류 발생, 재시도 중... ({attempt + 2}/{MAX_RETRIES + 1}) [model: {self.model}]")
                    continue
                raise last_error

        raise last_error or ValueError("Unknown error in Phase 2")


# Singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """싱글턴 LLM 서비스 인스턴스를 반환합니다.

    Returns:
        LLMService 인스턴스.
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
