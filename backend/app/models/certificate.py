"""Certificate 모델.

자격증 정보를 저장하는 테이블의 ORM 모델.
"""
import uuid

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Certificate(Base):
    """자격증 정보 모델.

    Attributes:
        id: 고유 식별자 (UUID)
        code: 자격증 코드 (T: 기술, S: 전문 등)
        category: 자격증 분류 (국가기술자격, 국가전문자격 등)
        series: 자격증 시리즈 (정보처리 등)
        title: 자격증명
        raw_id: 원본 식별자 (코드_자격증명)
        overview: 자격증 개요
        difficulty: 난이도 (1-5)
        study_period_days: 권장 학습 기간 (일)
        recommended_lectures: 추천 강의 목록 (JSON)
        exam_info: 시험 정보 (JSON)
        career_info: 취업/진로 정보 (JSON)
        user_reviews: 사용자 리뷰 (JSON)
        official_sources: 공식 출처 (JSON)
        study_guide: 학습 가이드 (JSON)
        vector_id: 벡터 DB ID
        passing_rate: 합격률
        created_at: 생성 시간
        updated_at: 수정 시간
    """

    __tablename__ = "certificates"

    # 기본 정보
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="고유 식별자 (UUID)"
    )
    code = Column(
        String(10),
        nullable=False,
        comment="자격증 코드 (S: 국가전문자격, T: 국가기술자격, Q: 과정평가형, W: 일학습병행)"
    )
    category = Column(
        String(100),
        nullable=False,
        comment="자격증 분류 (국가기술자격, 국가전문자격, 과정평가형자격, 일학습병행자격) - deprecated, categories 사용 권장"
    )
    categories = Column(
        JSON,
        nullable=True,
        default=list,
        comment="자격증 분류 목록 [{code, name}] - 같은 자격증이 여러 카테고리에 속할 수 있음"
    )
    series = Column(
        String(200),
        nullable=True,
        comment="자격증 시리즈/계열 (예: 정보처리, 전기, 건축 등)"
    )
    title = Column(
        String(300),
        nullable=False,
        comment="자격증명 (예: 정보처리기사, 세무사)"
    )
    raw_id = Column(
        String(500),
        unique=True,
        nullable=False,
        comment="원본 식별자 (코드_자격증명, 중복 방지용)"
    )

    # 보강 데이터 (LLM으로 생성)
    overview = Column(
        Text,
        nullable=True,
        comment="자격증 개요 (LLM 생성, 자격증 소개/설명)"
    )
    difficulty = Column(
        Integer,
        nullable=True,
        comment="난이도 (1-5, 1: 매우 쉬움, 5: 매우 어려움)"
    )
    study_period_days = Column(
        Integer,
        nullable=True,
        comment="권장 학습 기간 (일 단위)"
    )
    recommended_lectures = Column(
        JSON,
        nullable=True,
        default=list,
        comment="추천 강의 목록 [{platform, title, url, instructor, price, relevance_score}]"
    )
    exam_info = Column(
        JSON,
        nullable=True,
        default=dict,
        comment="시험 정보 {subjects, exam_type, passing_criteria, total_fee, schedule_link}"
    )
    career_info = Column(
        JSON,
        nullable=True,
        default=dict,
        comment="취업/진로 정보 {use_cases, related_jobs, average_salary, job_prospects, industry}"
    )
    user_reviews = Column(
        JSON,
        nullable=True,
        default=dict,
        comment="사용자 후기 요약 {summary, difficulty_feedback, study_tips}"
    )
    official_sources = Column(
        JSON,
        nullable=True,
        default=dict,
        comment="공식 출처 {official_site, issuing_organization, schedule_page}"
    )
    study_guide = Column(
        JSON,
        nullable=True,
        default=dict,
        comment="학습 가이드 {study_methods, learning_sequence, time_allocation, success_tips, recommended_books}"
    )
    vector_id = Column(
        String(100),
        nullable=True,
        comment="ChromaDB 벡터 ID (임베딩 동기화용)"
    )
    passing_rate = Column(
        Float,
        nullable=True,
        comment="합격률 (%, 0.0-100.0)"
    )

    # 타임스탬프
    created_at = Column(
        DateTime,
        server_default=func.now(),
        comment="생성 시간"
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        comment="수정 시간"
    )

    # Relationships
    study_plans = relationship("StudyPlan", back_populates="certificate")

    def __repr__(self) -> str:
        return f"<Certificate(id={self.id}, title={self.title})>"

    def to_dict(self) -> dict:
        """모델을 딕셔너리로 변환.

        None 값은 Pydantic 스키마의 기본값으로 대체됩니다.
        """
        return {
            "id": self.id,
            "code": self.code,
            "category": self.category,
            "categories": self.categories or [],
            "series": self.series,
            "title": self.title,
            "raw_id": self.raw_id,
            "overview": self.overview,
            "difficulty": self.difficulty,
            "study_period_days": self.study_period_days,
            # JSON 필드들: None이면 기본값 사용
            "recommended_lectures": self.recommended_lectures or [],
            "exam_info": self.exam_info or {},
            "career_info": self.career_info or {},
            "user_reviews": self.user_reviews or {},
            "official_sources": self.official_sources or {},
            "study_guide": self.study_guide or {},
            "vector_id": self.vector_id,
            "passing_rate": self.passing_rate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
