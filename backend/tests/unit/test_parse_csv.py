"""Tests for CSV parsing script.

Following TDD: These tests are written FIRST before implementation.
Expected result: Tests will FAIL until parse_csv.py is implemented.
"""
import json
import tempfile
from pathlib import Path

import pytest


class TestParseCsv:
    """Test suite for CSV parsing functionality."""

    @pytest.fixture
    def sample_csv_content(self) -> str:
        """Sample CSV content for testing."""
        return """자격구분코드,자격구분명,계열명,종목명
S,국가전문자격,세무사,세무사
S,국가전문자격,관세사,관세사
T,국가기술자격,정보처리,정보처리기사
"""

    @pytest.fixture
    def temp_csv_file(self, sample_csv_content: str) -> Path:
        """Create a temporary CSV file for testing."""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", delete=False, encoding="utf-8-sig"
        ) as f:
            f.write(sample_csv_content)
            temp_path = Path(f.name)
        yield temp_path
        # Cleanup
        if temp_path.exists():
            temp_path.unlink()

    def test_parse_csv_returns_list(self, temp_csv_file: Path) -> None:
        """Test that parse_csv returns a list of certificates."""
        from scripts.parse_csv import parse_csv_to_json

        result = parse_csv_to_json(temp_csv_file)

        assert isinstance(result, list)

    def test_parse_csv_correct_count(self, temp_csv_file: Path) -> None:
        """Test that parse_csv returns correct number of certificates."""
        from scripts.parse_csv import parse_csv_to_json

        result = parse_csv_to_json(temp_csv_file)

        assert len(result) == 3

    def test_parse_csv_certificate_structure(self, temp_csv_file: Path) -> None:
        """Test that each certificate has required fields."""
        from scripts.parse_csv import parse_csv_to_json

        result = parse_csv_to_json(temp_csv_file)

        required_fields = ["code", "category", "series", "title", "raw_id"]
        for cert in result:
            for field in required_fields:
                assert field in cert, f"Missing field: {field}"

    def test_parse_csv_first_certificate_values(self, temp_csv_file: Path) -> None:
        """Test that first certificate has correct values."""
        from scripts.parse_csv import parse_csv_to_json

        result = parse_csv_to_json(temp_csv_file)

        first_cert = result[0]
        assert first_cert["code"] == "S"
        assert first_cert["category"] == "국가전문자격"
        assert first_cert["series"] == "세무사"
        assert first_cert["title"] == "세무사"
        assert first_cert["raw_id"] == "S_세무사"

    def test_parse_csv_generates_correct_raw_id(self, temp_csv_file: Path) -> None:
        """Test that raw_id is generated correctly from code and title."""
        from scripts.parse_csv import parse_csv_to_json

        result = parse_csv_to_json(temp_csv_file)

        for cert in result:
            expected_raw_id = f"{cert['code']}_{cert['title']}"
            assert cert["raw_id"] == expected_raw_id

    def test_save_to_json_creates_file(self, temp_csv_file: Path) -> None:
        """Test that save_to_json creates a valid JSON file."""
        from scripts.parse_csv import parse_csv_to_json, save_to_json

        certificates = parse_csv_to_json(temp_csv_file)

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            output_path = Path(f.name)

        try:
            save_to_json(certificates, output_path)

            assert output_path.exists()

            with open(output_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)

            assert loaded == certificates
        finally:
            if output_path.exists():
                output_path.unlink()

    def test_parse_csv_handles_empty_file(self) -> None:
        """Test that parse_csv handles empty CSV gracefully."""
        from scripts.parse_csv import parse_csv_to_json

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", delete=False, encoding="utf-8-sig"
        ) as f:
            f.write("자격구분코드,자격구분명,계열명,종목명\n")
            temp_path = Path(f.name)

        try:
            result = parse_csv_to_json(temp_path)
            assert result == []
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def test_parse_csv_strips_whitespace(self) -> None:
        """Test that parse_csv strips whitespace from values."""
        from scripts.parse_csv import parse_csv_to_json

        csv_content = """자격구분코드,자격구분명,계열명,종목명
S, 국가전문자격 , 세무사 , 세무사
"""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", delete=False, encoding="utf-8-sig"
        ) as f:
            f.write(csv_content)
            temp_path = Path(f.name)

        try:
            result = parse_csv_to_json(temp_path)
            cert = result[0]

            assert cert["category"] == "국가전문자격"
            assert cert["series"] == "세무사"
            assert cert["title"] == "세무사"
        finally:
            if temp_path.exists():
                temp_path.unlink()
