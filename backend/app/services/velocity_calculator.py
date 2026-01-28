"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.velocity_calculator import VelocityCalculator
"""

from app.services.analytics.velocity_calculator import *  # noqa: F401, F403
