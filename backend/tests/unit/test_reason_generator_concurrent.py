"""ReasonGeneratorService 병렬 실행 및 에러 처리 테스트.

TDD: 순차 LLM 호출을 병렬로 변경하고, 타임아웃/에러 처리를 검증합니다.
"""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.recommendation import StructuredUserContext
from app.services.study.reason_generator import ReasonGeneratorService


def make_context(**kwargs) -> StructuredUserContext:
    """테스트용 StructuredUserContext 생성."""
    defaults = {
        "goal": "취업",
        "employment_status": "구직 중",
        "major_background": "비전공자",
        "weekly_study_hours": 10,
        "max_study_period_days": 180,
        "difficulty_preference": "중",
        "preferred_industries": ["IT"],
    }
    defaults.update(kwargs)
    return StructuredUserContext(**defaults)


def make_cert_info(title: str = "테스트 자격증") -> dict:
    """테스트용 자격증 정보."""
    return {
        "title": title,
        "overview": f"{title} 개요",
        "career_info": {"related_jobs": ["테스터"]},
        "feasibility_info": {"self_study_possible": True},
    }


class TestGenerateReasonsBatchConcurrent:
    """generate_reasons_batch 병렬 실행 테스트."""

    @pytest.mark.asyncio
    async def test_batch_runs_concurrently_not_sequentially(self):
        """여러 자격증의 추천 이유 생성이 병렬로 실행되어야 함.

        5개 자격증을 각각 0.1초씩 처리할 때,
        순차: 0.5초+, 병렬: ~0.1초.
        0.3초 이내 완료되면 병렬 실행으로 판단.
        """
        service = ReasonGeneratorService(api_key="test-key")

        # generate_reason을 0.1초 지연이 있는 mock으로 대체
        async def slow_generate(context, cert_info):
            await asyncio.sleep(0.1)
            return f"{cert_info['title']}에 대한 추천 이유"

        service.generate_reason = AsyncMock(side_effect=slow_generate)

        context = make_context()
        certs = [make_cert_info(f"자격증{i}") for i in range(5)]

        start = time.monotonic()
        results = await service.generate_reasons_batch(context, certs)
        elapsed = time.monotonic() - start

        assert len(results) == 5
        # 병렬 실행이면 0.3초 이내, 순차면 0.5초 이상
        assert elapsed < 0.3, f"병렬 실행 필요: {elapsed:.2f}초 소요 (순차 실행 감지)"

    @pytest.mark.asyncio
    async def test_batch_handles_partial_failures(self):
        """일부 자격증의 이유 생성 실패 시 기본 이유로 대체."""
        service = ReasonGeneratorService(api_key="test-key")

        call_count = 0

        async def sometimes_fail(context, cert_info):
            nonlocal call_count
            call_count += 1
            if call_count % 2 == 0:
                raise ValueError("LLM 호출 실패")
            return f"{cert_info['title']} 추천 이유"

        service.generate_reason = AsyncMock(side_effect=sometimes_fail)

        context = make_context()
        certs = [make_cert_info(f"자격증{i}") for i in range(4)]

        results = await service.generate_reasons_batch(context, certs)

        assert len(results) == 4
        # 홀수 번째는 성공, 짝수 번째는 기본 이유
        assert "추천 이유" in results[0]  # 성공
        assert "적합한 자격증입니다" in results[1]  # 기본 이유
        assert "추천 이유" in results[2]  # 성공
        assert "적합한 자격증입니다" in results[3]  # 기본 이유

    @pytest.mark.asyncio
    async def test_batch_all_failures_returns_default_reasons(self):
        """전부 실패해도 기본 이유를 반환해야 함 (에러 전파 금지)."""
        service = ReasonGeneratorService(api_key="test-key")

        async def always_fail(context, cert_info):
            raise ConnectionError("OpenAI API 연결 실패")

        service.generate_reason = AsyncMock(side_effect=always_fail)

        context = make_context()
        certs = [make_cert_info(f"자격증{i}") for i in range(3)]

        results = await service.generate_reasons_batch(context, certs)

        assert len(results) == 3
        for result in results:
            assert "적합한 자격증입니다" in result

    @pytest.mark.asyncio
    async def test_batch_preserves_order(self):
        """결과 순서가 입력 순서와 동일해야 함."""
        service = ReasonGeneratorService(api_key="test-key")

        async def ordered_generate(context, cert_info):
            # 각 자격증마다 다른 지연 (순서 뒤섞힘 가능성 테스트)
            title = cert_info["title"]
            idx = int(title.replace("자격증", ""))
            await asyncio.sleep(0.05 * (5 - idx))  # 뒤의 것이 더 빨리 완료
            return f"{title} 추천"

        service.generate_reason = AsyncMock(side_effect=ordered_generate)

        context = make_context()
        certs = [make_cert_info(f"자격증{i}") for i in range(5)]

        results = await service.generate_reasons_batch(context, certs)

        assert len(results) == 5
        for i, result in enumerate(results):
            assert f"자격증{i}" in result, f"순서 불일치: index {i}에 '{result}'"


class TestReasonGeneratorTimeout:
    """OpenAI 클라이언트 타임아웃 설정 테스트."""

    def test_client_has_reasonable_timeout(self):
        """AsyncOpenAI 클라이언트에 합리적인 타임아웃이 설정되어야 함.

        기본 600초(10분)는 너무 길다. 30초 이내여야 함.
        """
        service = ReasonGeneratorService(api_key="test-key")

        assert service.client is not None
        timeout = service.client.timeout
        assert timeout is not None

        # timeout이 int/float이면 직접 비교, httpx.Timeout이면 .read 사용
        if isinstance(timeout, (int, float)):
            assert timeout <= 30, f"Timeout이 너무 큼: {timeout}초"
        else:
            assert timeout.read <= 30, f"Read timeout이 너무 큼: {timeout.read}초"
