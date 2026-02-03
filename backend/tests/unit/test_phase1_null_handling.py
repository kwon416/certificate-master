"""Phase1Extraction 모델의 None 값 처리 테스트.

LLM이 difficulty, study_period_days에 None을 반환해도
기본값으로 처리되어야 합니다.
"""

import pytest
from pydantic import ValidationError

from app.services.llm.service import Phase1Extraction


class TestPhase1ExtractionNullHandling:
    """Phase1Extraction 모델의 None 값 처리 테스트."""

    def test_difficulty_with_none_should_use_default(self):
        """difficulty가 None이면 기본값 3을 사용해야 합니다."""
        data = {
            "overview_draft": "테스트 개요",
            "difficulty": None,  # None 값
            "study_period_days": 30,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        result = Phase1Extraction(**data)
        assert result.difficulty == 3  # 기본값 3

    def test_study_period_days_with_none_should_use_default(self):
        """study_period_days가 None이면 기본값 90을 사용해야 합니다."""
        data = {
            "overview_draft": "테스트 개요",
            "difficulty": 3,
            "study_period_days": None,  # None 값
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        result = Phase1Extraction(**data)
        assert result.study_period_days == 90  # 기본값 90일

    def test_both_fields_with_none_should_use_defaults(self):
        """difficulty와 study_period_days 모두 None이면 기본값을 사용해야 합니다."""
        data = {
            "overview_draft": "테스트 개요",
            "difficulty": None,
            "study_period_days": None,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        result = Phase1Extraction(**data)
        assert result.difficulty == 3
        assert result.study_period_days == 90

    def test_valid_values_should_be_preserved(self):
        """유효한 값이 주어지면 그대로 유지해야 합니다."""
        data = {
            "overview_draft": "테스트 개요",
            "difficulty": 4,
            "study_period_days": 180,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        result = Phase1Extraction(**data)
        assert result.difficulty == 4
        assert result.study_period_days == 180

    def test_difficulty_boundary_values(self):
        """difficulty의 경계값(1-5)이 올바르게 처리되어야 합니다."""
        # 최소값 1
        data_min = {
            "overview_draft": "테스트",
            "difficulty": 1,
            "study_period_days": 30,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }
        result_min = Phase1Extraction(**data_min)
        assert result_min.difficulty == 1

        # 최대값 5
        data_max = {
            "overview_draft": "테스트",
            "difficulty": 5,
            "study_period_days": 30,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }
        result_max = Phase1Extraction(**data_max)
        assert result_max.difficulty == 5

    def test_difficulty_out_of_range_should_fail(self):
        """difficulty가 1-5 범위를 벗어나면 ValidationError가 발생해야 합니다."""
        data = {
            "overview_draft": "테스트",
            "difficulty": 6,  # 범위 초과
            "study_period_days": 30,
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        with pytest.raises(ValidationError):
            Phase1Extraction(**data)

    def test_study_period_days_zero_should_fail(self):
        """study_period_days가 0이면 ValidationError가 발생해야 합니다."""
        data = {
            "overview_draft": "테스트",
            "difficulty": 3,
            "study_period_days": 0,  # ge=1 위반
            "exam_info": {},
            "career_info": {},
            "user_reviews": {},
            "study_guide": {},
            "official_sources": {},
        }

        with pytest.raises(ValidationError):
            Phase1Extraction(**data)
