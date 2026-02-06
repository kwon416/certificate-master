"""Step 1: 상황 구조화 서비스.

사용자의 자연어 입력을 LLM을 통해 구조화된 JSON으로 변환합니다.
"""

import json
import logging
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.recommendation import StructuredUserContext
from app.services.study.prompts.context_extraction import (
    CONTEXT_EXTRACTION_SYSTEM_PROMPT,
    CONTEXT_EXTRACTION_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class ContextExtractorService:
    """사용자 자연어 입력을 구조화된 컨텍스트로 변환하는 서비스."""

    def __init__(self, api_key: Optional[str] = None):
        """서비스를 초기화합니다.

        Args:
            api_key: OpenAI API 키. 제공되지 않으면 설정에서 로드합니다.
        """
        settings = get_settings()
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL_NAME

        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def extract_context(self, user_input: str) -> StructuredUserContext:
        """자연어 입력을 구조화된 사용자 컨텍스트로 변환합니다.

        Args:
            user_input: 사용자의 자연어 입력.

        Returns:
            StructuredUserContext: 구조화된 사용자 상황 정보.

        Raises:
            ValueError: API 키가 설정되지 않았거나 응답이 비어있는 경우.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY not configured")

        logger.info(f"[ContextExtractor] Processing user input: {user_input[:50]}...")

        response_data = await self._call_llm(user_input)

        return StructuredUserContext(**response_data)

    async def _call_llm(self, user_input: str) -> dict:
        """LLM을 호출하여 구조화된 데이터를 반환합니다.

        Args:
            user_input: 사용자의 자연어 입력.

        Returns:
            dict: LLM이 생성한 구조화된 데이터.
        """
        user_prompt = CONTEXT_EXTRACTION_USER_PROMPT_TEMPLATE.format(
            user_input=user_input
        )

        # Note: temperature 파라미터는 o1/o3 계열 모델에서 지원되지 않으므로 제거
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": CONTEXT_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")

        logger.info(f"[ContextExtractor] LLM response received")

        return json.loads(content)


# Singleton instance
_context_extractor: Optional[ContextExtractorService] = None


def get_context_extractor() -> ContextExtractorService:
    """싱글턴 ContextExtractorService 인스턴스를 반환합니다."""
    global _context_extractor
    if _context_extractor is None:
        _context_extractor = ContextExtractorService()
    return _context_extractor
