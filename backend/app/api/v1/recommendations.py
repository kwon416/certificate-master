"""Recommendation API endpoints.

이 모듈은 사용자 컨텍스트 기반 자격증 추천 API를 제공합니다.

MariaDB(SQLAlchemy)로 마이그레이션됨 (2026-01-22).
"""
import logging

from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
)
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    db: DBSession,
) -> RecommendationResponse:
    """사용자 컨텍스트 기반 자격증 추천.

    사용자의 관심 분야, 목표, 상태 등을 기반으로
    맞춤형 자격증을 추천합니다.

    Args:
        request: 추천 요청 (관심 분야, 목표, 상태, 학습 시간, 목표 기간)
        db: SQLAlchemy 데이터베이스 세션

    Returns:
        RecommendationResponse: 추천 자격증 목록과 요약 정보
    """
    logger.info(f"Recommendation request: {request.model_dump()}")

    # Create service and get recommendations
    service = RecommendationService(db)
    response = await service.get_recommendations(request)

    logger.info(f"Returning {len(response.recommendations)} recommendations")
    return response
