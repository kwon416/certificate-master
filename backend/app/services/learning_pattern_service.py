"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.learning_pattern_service import LearningPatternService
"""

from app.services.analytics.learning_pattern_service import *  # noqa: F401, F403
