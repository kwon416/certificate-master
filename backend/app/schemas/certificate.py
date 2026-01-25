"""Pydantic schemas for Certificate model.

This module defines request/response schemas for certificate endpoints.
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, ConfigDict


class CategoryInfo(BaseModel):
    """카테고리 정보 (M:N 관계 지원)."""

    code: str = Field(..., description="자격구분코드 (S, T, Q, W)")
    name: str = Field(..., description="자격구분명 (국가전문자격, 국가기술자격 등)")


class CertificateBase(BaseModel):
    """Base schema for Certificate with common fields."""

    code: str = Field(..., description="자격구분코드 (S, T, Q 등) - deprecated")
    category: str = Field(..., description="자격구분명 (국가전문자격, 국가기술자격 등) - deprecated")
    categories: list[CategoryInfo] = Field(default_factory=list, description="자격증이 속한 카테고리 목록")
    series: Optional[str] = Field(None, description="계열명")
    title: str = Field(..., description="종목명 (자격증 이름)")


class AutocompleteResult(BaseModel):
    """Schema for autocomplete results."""

    id: str = Field(..., description="자격증 ID")
    title: str = Field(..., description="자격증 제목")
    category: str = Field(..., description="자격구분 - deprecated")
    categories: list[CategoryInfo] = Field(default_factory=list, description="자격증이 속한 카테고리 목록")
    series: Optional[str] = Field(None, description="계열명")


class SeriesByCategory(BaseModel):
    """Schema for series grouped by category."""
    
    category: str = Field(..., description="자격구분")
    series: list[str] = Field(..., description="계열 목록")


class CertificateCreate(CertificateBase):
    """Schema for creating a new certificate."""

    raw_id: str = Field(..., description="고유 식별자 (code_title 형식)")


# ExamSchedule and Eligibility models removed - users should check official sources


class CareerInfo(BaseModel):
    """진로 및 활용 정보."""
    
    use_cases: list[str] = Field(default_factory=list, description="활용 분야")
    related_jobs: list[str] = Field(default_factory=list, description="관련 직업")
    average_salary: Optional[str] = Field(None, description="평균 연봉")
    job_prospects: Optional[str] = Field(None, description="취업 전망")
    industry: list[str] = Field(default_factory=list, description="관련 산업")


class UserReviews(BaseModel):
    """실제 후기 요약."""
    
    summary: Optional[str] = Field(None, description="전체 요약")
    difficulty_feedback: Optional[str] = Field(None, description="난이도 평가")
    study_tips: list[str] = Field(default_factory=list, description="학습 팁")
    common_challenges: list[str] = Field(default_factory=list, description="공통 어려움")


class OfficialSources(BaseModel):
    """공식 출처 정보."""

    official_site: Optional[str] = Field(None, description="공식 사이트")
    issuing_organization: Optional[str] = Field(None, description="발급 기관")
    reference_urls: list[str] = Field(default_factory=list, description="참고 링크")


class TimeAllocation(BaseModel):
    """학습 시간 배분 정보."""

    theory: Optional[str] = Field(None, description="이론 학습 비율 (예: 40%)")
    practice: Optional[str] = Field(None, description="실전 문제 비율 (예: 50%)")
    review: Optional[str] = Field(None, description="복습 비율 (예: 10%)")


class RecommendedBook(BaseModel):
    """추천 교재 정보."""

    title: str = Field(..., description="교재명")
    publisher: Optional[str] = Field(None, description="출판사")
    type: Optional[str] = Field(None, description="교재 유형 (필기/실기/종합)")
    description: Optional[str] = Field(None, description="교재 설명")


class StudyGuide(BaseModel):
    """학습 가이드 정보."""

    study_methods: list[str] = Field(
        default_factory=list,
        description="추천 공부 방법 (예: 교재 중심, 기출문제 위주)"
    )
    learning_sequence: list[str] = Field(
        default_factory=list,
        description="단계별 학습 순서 (예: 1단계: 기초 이론 30일)"
    )
    time_allocation: Optional[dict[str, str]] = Field(
        None,
        description="시간 배분 가이드 (TimeAllocation 구조)"
    )
    recommended_books: list[dict[str, Any]] = Field(
        default_factory=list,
        description="추천 교재 목록 (RecommendedBook 구조)"
    )
    success_tips: list[str] = Field(
        default_factory=list,
        description="합격을 위한 핵심 팁"
    )


class ExamInfo(BaseModel):
    """시험 정보 상세 구조."""
    
    subjects: list[str] = Field(default_factory=list, description="시험 과목")
    exam_type: str = Field(default="", description="시험 형식 (필기/실기/면접)")
    passing_criteria: str = Field(default="", description="합격 기준")
    total_fee: Optional[str] = Field(None, description="총 응시료 (원)")


class RecommendedLecture(BaseModel):
    """추천 강의 구조."""
    
    platform: str = Field(..., description="플랫폼명 (에듀윌, 해커스 등)")
    title: str = Field(..., description="강의명")
    url: str = Field(..., description="강의 링크")
    instructor: Optional[str] = Field(None, description="강사명")
    price: Optional[str] = Field(None, description="가격 (예: '150000원', '무료')")
    rating: Optional[float] = Field(None, ge=0, le=5, description="평점")
    review_count: Optional[int] = Field(None, ge=0, description="리뷰 수")
    relevance_score: float = Field(
        default=1.0, ge=0, le=1, description="관련성 점수 (LLM 평가)"
    )


class CertificateUpdate(BaseModel):
    """Schema for updating a certificate (partial update)."""

    model_config = ConfigDict(extra="forbid")

    # 벡터 ID (ChromaDB 동기화용)
    vector_id: Optional[str] = Field(None, description="ChromaDB 벡터 ID")

    # 필수 정보
    overview: Optional[str] = Field(None, description="자격증 개요 (3-5문장)")
    difficulty: Optional[int] = Field(
        None, ge=1, le=5, description="난이도 (1-5)"
    )
    study_period_days: Optional[int] = Field(
        None, ge=1, description="권장 준비기간 (일)"
    )
    
    # 시험 정보
    exam_info: Optional[dict[str, Any]] = Field(
        None, description="시험 정보 (ExamInfo 구조)"
    )
    
    # 학습 & 강의
    recommended_lectures: Optional[list[dict[str, Any]]] = Field(
        None, description="추천 강의 목록 (RecommendedLecture 구조)"
    )
    
    # 진로 & 후기
    career_info: Optional[dict[str, Any]] = Field(
        None, description="진로 정보 (CareerInfo 구조)"
    )
    user_reviews: Optional[dict[str, Any]] = Field(
        None, description="후기 요약 (UserReviews 구조)"
    )
    
    # 공식 출처
    official_sources: Optional[dict[str, Any]] = Field(
        None, description="공식 출처 (OfficialSources 구조)"
    )

    # 학습 가이드
    study_guide: Optional[dict[str, Any]] = Field(
        None, description="학습 가이드 (StudyGuide 구조)"
    )

    # 통계
    passing_rate: Optional[float] = Field(
        None, ge=0, le=100, description="합격률 (%)"
    )


class Certificate(CertificateBase):
    """Schema for certificate response."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="UUID")
    raw_id: str = Field(..., description="고유 식별자")

    # 벡터 ID (ChromaDB 동기화용)
    vector_id: Optional[str] = Field(None, description="ChromaDB 벡터 ID")

    # 필수 정보
    overview: Optional[str] = Field(None, description="자격증 개요 (3-5문장)")
    difficulty: Optional[int] = Field(None, description="난이도 (1-5)")
    study_period_days: Optional[int] = Field(None, description="권장 준비기간 (일)")
    
    # 시험 정보
    exam_info: dict[str, Any] = Field(
        default_factory=dict, description="시험 정보 (ExamInfo 구조)"
    )
    
    # 학습 & 강의
    recommended_lectures: list[dict[str, Any]] = Field(
        default_factory=list, description="추천 강의 목록 (RecommendedLecture 구조)"
    )
    
    # 진로 & 후기
    career_info: dict[str, Any] = Field(
        default_factory=dict, description="진로 정보 (CareerInfo 구조)"
    )
    user_reviews: dict[str, Any] = Field(
        default_factory=dict, description="후기 요약 (UserReviews 구조)"
    )
    
    # 공식 출처
    official_sources: dict[str, Any] = Field(
        default_factory=dict, description="공식 출처 (OfficialSources 구조)"
    )

    # 학습 가이드
    study_guide: dict[str, Any] = Field(
        default_factory=dict, description="학습 가이드 (StudyGuide 구조)"
    )

    # 통계 (Phase 2)
    passing_rate: Optional[float] = Field(None, description="합격률 (%)")

    # Timestamps
    created_at: datetime
    updated_at: datetime


class CertificateList(BaseModel):
    """Schema for paginated certificate list response."""

    items: list[Certificate]
    total: int
    page: int = 1
    page_size: int = 20
    has_more: bool = False


class CertificateSearchParams(BaseModel):
    """Schema for certificate search query parameters."""

    q: Optional[str] = Field(None, description="검색 키워드")
    category: Optional[str] = Field(None, description="자격구분명 필터")
    code: Optional[str] = Field(None, description="자격구분코드 필터")
    difficulty_min: Optional[int] = Field(None, ge=1, le=5, description="최소 난이도")
    difficulty_max: Optional[int] = Field(None, ge=1, le=5, description="최대 난이도")
    page: int = Field(1, ge=1, description="페이지 번호")
    page_size: int = Field(20, ge=1, le=100, description="페이지 크기")

