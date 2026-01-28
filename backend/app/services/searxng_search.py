"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.searxng_search import SearXNGSearchService
"""

from app.services.search.searxng_search import *  # noqa: F401, F403
