"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.analytics_service import AnalyticsService
"""

from app.services.analytics.analytics_service import *  # noqa: F401, F403
