"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.embedding_service import EmbeddingService
"""

from app.services.embedding.service import *  # noqa: F401, F403
