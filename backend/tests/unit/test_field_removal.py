"""필드 제거 테스트.

요구사항:
1. CBT 가능 여부(cbt_available) 제거
2. 합격률(passing_rate) 제거
3. 우대 기업(preferred_companies) 제거
4. 추천 강의에서 후기 페이지 제외 규칙 추가
"""

import pytest
import inspect

from app.services.llm.service import (
    LLMService,
    ExtractedExamScheduleDetail,
    ExtractedJobMarketInfo,
    Phase1Extraction,
    CertificateEnrichment,
)


class TestCbtAvailableRemoval:
    """CBT 가능 여부 필드 제거 테스트."""

    def test_exam_schedule_detail_no_cbt_available(self):
        """ExtractedExamScheduleDetail에서 cbt_available 필드가 제거되어야 합니다."""
        assert "cbt_available" not in ExtractedExamScheduleDetail.model_fields

    def test_prompt_no_cbt_available_mention(self):
        """LLM 프롬프트에서 cbt_available 관련 내용이 제거되어야 합니다."""
        source1 = inspect.getsource(LLMService._phase1_extract)
        source2 = inspect.getsource(LLMService._phase2_refine)
        combined = source1 + source2

        # cbt_available 필드가 프롬프트에 없어야 함
        assert "cbt_available" not in combined


class TestPassingRateRemoval:
    """합격률 필드 제거 테스트."""

    def test_phase1_extraction_no_passing_rate(self):
        """Phase1Extraction에서 passing_rate 필드가 제거되어야 합니다."""
        assert "passing_rate" not in Phase1Extraction.model_fields

    def test_certificate_enrichment_no_passing_rate(self):
        """CertificateEnrichment에서 passing_rate 필드가 제거되어야 합니다."""
        assert "passing_rate" not in CertificateEnrichment.model_fields

    def test_prompt_no_passing_rate_extraction(self):
        """LLM 프롬프트에서 passing_rate 추출 규칙이 제거되어야 합니다."""
        source1 = inspect.getsource(LLMService._phase1_extract)
        source2 = inspect.getsource(LLMService._phase2_refine)
        combined = source1 + source2

        # passing_rate 관련 키워드가 JSON 스키마에서 제거되어야 함
        # "passing_rate": 패턴이 없어야 함
        assert '"passing_rate":' not in combined


class TestPreferredCompaniesRemoval:
    """우대 기업 필드 제거 테스트."""

    def test_job_market_info_no_preferred_companies(self):
        """ExtractedJobMarketInfo에서 preferred_companies 필드가 제거되어야 합니다."""
        assert "preferred_companies" not in ExtractedJobMarketInfo.model_fields

    def test_prompt_no_preferred_companies(self):
        """LLM 프롬프트에서 preferred_companies 관련 내용이 제거되어야 합니다."""
        source1 = inspect.getsource(LLMService._phase1_extract)
        source2 = inspect.getsource(LLMService._phase2_refine)
        combined = source1 + source2

        # preferred_companies 필드가 프롬프트에 없어야 함
        assert "preferred_companies" not in combined


class TestLectureReviewExclusion:
    """추천 강의 후기 페이지 제외 테스트."""

    def test_prompt_excludes_lecture_reviews(self):
        """LLM 프롬프트에 강의 후기 제외 규칙이 있어야 합니다."""
        source1 = inspect.getsource(LLMService._phase1_extract)
        source2 = inspect.getsource(LLMService._phase2_refine)
        combined = source1 + source2

        # 후기 페이지 제외 관련 키워드
        exclusion_keywords = [
            "후기 페이지",
            "후기 제외",
            "리뷰 페이지",
            "수강 후기",
        ]

        has_exclusion_rule = any(kw in combined for kw in exclusion_keywords)
        assert has_exclusion_rule, "프롬프트에 강의 후기 제외 규칙이 없습니다"
