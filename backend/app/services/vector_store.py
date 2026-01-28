"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.vector_store import VectorStoreService
"""

from app.services.embedding.vector_store import *  # noqa: F401, F403
