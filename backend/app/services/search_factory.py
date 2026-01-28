"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.search_factory import get_search_service
"""

from app.services.search.factory import *  # noqa: F401, F403
