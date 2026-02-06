"""Step 5: 추천 이유 생성 서비스.

사용자 상황과 자격증 정보를 바탕으로 개인화된 추천 이유를 생성합니다.
"""

import json
import logging
from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.recommendation import StructuredUserContext
from app.services.study.prompts.recommendation_reason import (
    RECOMMENDATION_REASON_SYSTEM_PROMPT,
    RECOMMENDATION_REASON_USER_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class ReasonGeneratorService:
    """개인화된 추천 이유를 생성하는 서비스."""

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

    async def generate_reason(
        self,
        context: StructuredUserContext,
        certificate_info: dict[str, Any],
    ) -> str:
        """사용자 상황과 자격증 정보를 바탕으로 추천 이유를 생성합니다.

        Args:
            context: 구조화된 사용자 상황 정보.
            certificate_info: 자격증 정보 딕셔너리.

        Returns:
            str: 개인화된 추천 이유 (2-3문장).

        Raises:
            ValueError: API 키가 설정되지 않았거나 응답이 비어있는 경우.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY not configured")

        cert_title = certificate_info.get("title", "자격증")
        logger.info(f"[ReasonGenerator] Generating reason for: {cert_title}")

        reason = await self._call_llm(context, certificate_info)

        return reason.strip()

    async def _call_llm(
        self,
        context: StructuredUserContext,
        certificate_info: dict[str, Any],
    ) -> str:
        """LLM을 호출하여 추천 이유를 생성합니다.

        Args:
            context: 구조화된 사용자 상황 정보.
            certificate_info: 자격증 정보 딕셔너리.

        Returns:
            str: 생성된 추천 이유.
        """
        context_json = context.model_dump_json(indent=2)
        cert_json = json.dumps(certificate_info, ensure_ascii=False, indent=2)

        user_prompt = RECOMMENDATION_REASON_USER_PROMPT_TEMPLATE.format(
            user_context=context_json,
            certificate_info=cert_json,
        )

        # Note: temperature 파라미터는 o1/o3 계열 모델에서 지원되지 않으므로 제거
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": RECOMMENDATION_REASON_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")

        logger.info(f"[ReasonGenerator] Generated reason for {certificate_info.get('title', 'cert')}")

        return content

    async def generate_reasons_batch(
        self,
        context: StructuredUserContext,
        certificates: list[dict[str, Any]],
    ) -> list[str]:
        """여러 자격증에 대한 추천 이유를 일괄 생성합니다.

        Args:
            context: 구조화된 사용자 상황 정보.
            certificates: 자격증 정보 리스트.

        Returns:
            list[str]: 각 자격증에 대한 추천 이유 리스트.
        """
        reasons = []
        for cert in certificates:
            try:
                reason = await self.generate_reason(context, cert)
                reasons.append(reason)
            except Exception as e:
                logger.error(f"[ReasonGenerator] Error generating reason: {e}")
                # 기본 추천 이유
                reasons.append(
                    f"{cert.get('title', '이 자격증')}은(는) "
                    f"{context.goal} 목표에 적합한 자격증입니다."
                )
        return reasons


# Singleton instance
_reason_generator: Optional[ReasonGeneratorService] = None


def get_reason_generator() -> ReasonGeneratorService:
    """싱글턴 ReasonGeneratorService 인스턴스를 반환합니다."""
    global _reason_generator
    if _reason_generator is None:
        _reason_generator = ReasonGeneratorService()
    return _reason_generator
