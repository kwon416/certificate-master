"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.recommendation_service import RecommendationService
"""

from app.services.study.recommendation_service import *  # noqa: F401, F403
