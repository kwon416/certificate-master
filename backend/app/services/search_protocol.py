"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.search_protocol import SearchServiceProtocol
"""

from app.services.search.protocol import *  # noqa: F401, F403
