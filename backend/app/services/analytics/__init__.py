"""학습 분석 서비스 모듈.

- AnalyticsService: 복합 진행도 분석
- LearningPatternService: 학습 패턴 분석
- VelocityCalculator: 학습 속도 계산
"""

from .analytics_service import AnalyticsService
from .learning_pattern_service import LearningPatternService
from .velocity_calculator import VelocityCalculator

__all__ = [
    "AnalyticsService",
    "LearningPatternService",
    "VelocityCalculator",
]
