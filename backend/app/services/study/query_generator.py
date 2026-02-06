"""Step 3: 검색 쿼리 생성 서비스.

구조화된 사용자 컨텍스트를 벡터 검색에 최적화된 쿼리로 변환합니다.
"""

import logging
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.recommendation import StructuredUserContext
from app.services.study.prompts.query_generation import (
    QUERY_GENERATION_SYSTEM_PROMPT,
    QUERY_GENERATION_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class QueryGeneratorService:
    """구조화된 컨텍스트를 벡터 검색 쿼리로 변환하는 서비스."""

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

    async def generate_query(self, context: StructuredUserContext) -> str:
        """구조화된 컨텍스트를 벡터 검색 쿼리로 변환합니다.

        Args:
            context: 구조화된 사용자 상황 정보.

        Returns:
            str: 벡터 검색에 사용할 쿼리 텍스트.

        Raises:
            ValueError: API 키가 설정되지 않았거나 응답이 비어있는 경우.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY not configured")

        logger.info(f"[QueryGenerator] Generating query for goal: {context.goal}")

        query = await self._call_llm(context)

        return query.strip()

    async def _call_llm(self, context: StructuredUserContext) -> str:
        """LLM을 호출하여 검색 쿼리를 생성합니다.

        Args:
            context: 구조화된 사용자 상황 정보.

        Returns:
            str: 생성된 검색 쿼리.
        """
        context_json = context.model_dump_json(indent=2)
        user_prompt = QUERY_GENERATION_USER_PROMPT_TEMPLATE.format(
            structured_context=context_json
        )

        # Note: temperature 파라미터는 o1/o3 계열 모델에서 지원되지 않으므로 제거
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": QUERY_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")

        logger.info(f"[QueryGenerator] Generated query: {content[:50]}...")

        return content


# Singleton instance
_query_generator: Optional[QueryGeneratorService] = None


def get_query_generator() -> QueryGeneratorService:
    """싱글턴 QueryGeneratorService 인스턴스를 반환합니다."""
    global _query_generator
    if _query_generator is None:
        _query_generator = QueryGeneratorService()
    return _query_generator
