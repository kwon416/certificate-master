"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.llm_service import LLMService
"""

from app.services.llm.service import *  # noqa: F401, F403
