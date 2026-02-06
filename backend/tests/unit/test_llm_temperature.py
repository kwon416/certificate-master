"""LLM 서비스의 temperature 파라미터 스킵 로직을 테스트합니다."""
import pytest
from unittest.mock import patch

from app.services.llm.service import LLMService


class TestTemperatureSkipLogic:
    """temperature 파라미터 스킵 로직 테스트."""

    def test_should_skip_temperature_for_gpt5_nano(self):
        """gpt-5-nano 모델은 temperature를 스킵해야 합니다."""
        with patch("app.services.llm.service.get_settings") as mock_settings:
            mock_settings.return_value.OPENAI_API_KEY = "test-key"
            mock_settings.return_value.OPENAI_MODEL_NAME = "gpt-5-nano"

            service = LLMService()
            assert service.should_skip_temperature() is True

    def test_should_not_skip_temperature_for_gpt4o_mini(self):
        """gpt-4o-mini 모델은 temperature를 사용해야 합니다."""
        with patch("app.services.llm.service.get_settings") as mock_settings:
            mock_settings.return_value.OPENAI_API_KEY = "test-key"
            mock_settings.return_value.OPENAI_MODEL_NAME = "gpt-4o-mini"

            service = LLMService()
            assert service.should_skip_temperature() is False

    def test_build_completion_params_excludes_temperature_for_unsupported_models(self):
        """temperature를 지원하지 않는 모델에서 파라미터가 제외됩니다."""
        with patch("app.services.llm.service.get_settings") as mock_settings:
            mock_settings.return_value.OPENAI_API_KEY = "test-key"
            mock_settings.return_value.OPENAI_MODEL_NAME = "gpt-5-nano"

            service = LLMService()
            params = service.build_completion_params(
                messages=[{"role": "user", "content": "test"}],
                temperature=0.3,
            )

            assert "temperature" not in params
            assert params["model"] == "gpt-5-nano"
            assert params["messages"] == [{"role": "user", "content": "test"}]

    def test_build_completion_params_includes_temperature_for_supported_models(self):
        """temperature를 지원하는 모델에서 파라미터가 포함됩니다."""
        with patch("app.services.llm.service.get_settings") as mock_settings:
            mock_settings.return_value.OPENAI_API_KEY = "test-key"
            mock_settings.return_value.OPENAI_MODEL_NAME = "gpt-4o-mini"

            service = LLMService()
            params = service.build_completion_params(
                messages=[{"role": "user", "content": "test"}],
                temperature=0.3,
            )

            assert params["temperature"] == 0.3
            assert params["model"] == "gpt-4o-mini"
