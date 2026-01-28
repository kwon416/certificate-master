"""Backward compatibility module.

기존 import 경로 호환성 유지:
from app.services.content_crawler import ContentCrawlerService
"""

from app.services.search.content_crawler import *  # noqa: F401, F403
