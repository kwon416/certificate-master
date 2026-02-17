"""Recommendation API endpoints.

이 모듈은 사용자 컨텍스트 기반 자격증 추천 API를 제공합니다.

MariaDB(SQLAlchemy)로 마이그레이션됨 (2026-01-22).
"""
import logging

from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.recommendation import (
    NaturalLanguageRequest,
    NaturalLanguageResponse,
    RecommendationRequest,
    RecommendationResponse,
    UnifiedRecommendationRequest,
    UnifiedRecommendationResponse,
)
from app.services.recommendation_service import RecommendationService
from app.services.study.natural_recommendation_service import NaturalRecommendationService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=RecommendationResponse, deprecated=True)
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

    try:
        # Create service and get recommendations
        logger.info("Creating RecommendationService...")
        service = RecommendationService(db)
        logger.info("RecommendationService created, calling get_recommendations...")
        response = await service.get_recommendations(request)

        logger.info(f"Returning {len(response.recommendations)} recommendations")
        return response
    except Exception as e:
        logger.error(f"Recommendation error: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise


@router.post("/natural", response_model=NaturalLanguageResponse, deprecated=True)
async def get_natural_recommendations(
    request: NaturalLanguageRequest,
    db: DBSession,
) -> NaturalLanguageResponse:
    """자연어 기반 자격증 추천 (NEW).

    사용자의 자연어 입력을 분석하여 맞춤형 자격증을 추천합니다.

    5단계 파이프라인:
    1. LLM 상황 구조화 (자연어 → JSON)
    2. 하드 필터링 (비전공자/재직자 조건)
    3. 임베딩 검색 (LLM 쿼리 생성 + ChromaDB)
    4. 후처리 점수화
    5. LLM 추천 이유 생성

    Args:
        request: 자연어 추천 요청 (user_input: 10-1000자)
        db: SQLAlchemy 데이터베이스 세션

    Returns:
        NaturalLanguageResponse: 구조화된 컨텍스트와 추천 결과

    Example:
        >>> POST /api/v1/recommendations/natural
        >>> {"user_input": "비전공자인데 IT 분야 취업 준비 중입니다..."}
    """
    logger.info(f"Natural recommendation request: {request.user_input[:50]}...")

    try:
        service = NaturalRecommendationService(db)
        response = await service.get_recommendations(request)

        logger.info(f"Returning {len(response.recommendations)} natural recommendations")
        return response
    except Exception as e:
        logger.error(f"Natural recommendation error: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise


@router.post("/unified", response_model=UnifiedRecommendationResponse)
async def get_unified_recommendations(
    request: UnifiedRecommendationRequest,
    db: DBSession,
) -> UnifiedRecommendationResponse:
    """통합 추천 (분야 선택 + 자연어).

    사용자가 관심 분야를 선택하고 자연어로 상황을 설명하면,
    해당 분야 내에서 맞춤형 자격증을 추천합니다.

    3단계 파이프라인:
    1. LLM 상황 구조화 + 검색 쿼리 생성
    2. 도메인 필터 + 벡터 검색
    3. LLM 추천 이유 생성

    Args:
        request: 통합 추천 요청 (domains + user_input)
        db: SQLAlchemy 데이터베이스 세션

    Returns:
        UnifiedRecommendationResponse: 추천 결과
    """
    logger.info(f"Unified recommendation request: domains={request.domains}, input={request.user_input[:50]}...")

    try:
        service = NaturalRecommendationService(db)
        response = await service.get_unified_recommendations(request)

        logger.info(f"Returning {len(response.recommendations)} unified recommendations")
        return response
    except Exception as e:
        logger.error(f"Unified recommendation error: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
