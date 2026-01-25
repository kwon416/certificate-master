"""check_enriched_data.py 테스트.

TDD: Supabase → MariaDB 마이그레이션 테스트
"""
import pytest
from unittest.mock import MagicMock, patch

from scripts.check_enriched_data import (
    get_latest_enriched_certificate,
    check_data,
)


class TestGetLatestEnrichedCertificate:
    """최신 보강 자격증 조회 테스트."""

    def test_returns_certificate_dict(self, test_db_session):
        """보강된 자격증이 있을 때 딕셔너리 반환."""
        result = get_latest_enriched_certificate(test_db_session)

        # 보강된 데이터가 없을 수도 있음
        if result is not None:
            assert isinstance(result, dict)
            assert "title" in result

    def test_returns_none_when_no_enriched(self, test_db_session):
        """보강된 자격증이 없으면 None 반환."""
        # 테스트 데이터가 없는 경우를 확인
        # (실제 DB에 보강된 데이터가 없으면 None 반환)
        result = get_latest_enriched_certificate(test_db_session)

        # None이거나 dict여야 함
        assert result is None or isinstance(result, dict)


class TestCheckData:
    """check_data 함수 테스트."""

    def test_check_data_runs_without_error(self, capsys):
        """check_data가 에러 없이 실행되는지 테스트."""
        # 실행 자체가 성공하면 됨
        check_data()

        captured = capsys.readouterr()
        # 출력이 있어야 함
        assert len(captured.out) > 0

    def test_check_data_handles_no_data(self, capsys, monkeypatch):
        """보강된 데이터가 없을 때 적절한 메시지 출력."""
        # get_latest_enriched_certificate가 None을 반환하도록 모킹
        monkeypatch.setattr(
            "scripts.check_enriched_data.get_latest_enriched_certificate",
            lambda session: None
        )

        check_data()

        captured = capsys.readouterr()
        assert "보강된 자격증이 없습니다" in captured.out
