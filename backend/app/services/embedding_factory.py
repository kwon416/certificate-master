"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.embedding_factory import get_embedding_service
"""

from app.services.embedding.factory import *  # noqa: F401, F403
