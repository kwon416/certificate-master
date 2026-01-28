"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.study_plan_service import StudyPlanService
"""

from app.services.study.study_plan_service import *  # noqa: F401, F403
