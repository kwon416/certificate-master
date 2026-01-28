"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.enrichment_service import get_enrichment_service
"""

from app.services.llm.enrichment_service import *  # noqa: F401, F403
