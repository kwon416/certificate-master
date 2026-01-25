"""카테고리별 분리 스크립트 테스트."""
import csv
import json
import tempfile
from pathlib import Path

import pytest

from scripts.split_by_category import (
    CATEGORIES,
    split_csv_by_category,
    save_category_csv,
    save_category_json,
    get_category_filename,
)


@pytest.fixture
def sample_csv_data():
    """테스트용 샘플 CSV 데이터."""
    return [
        {"자격구분코드": "S", "자격구분명": "국가전문자격", "계열명": "세무사", "종목명": "세무사"},
        {"자격구분코드": "S", "자격구분명": "국가전문자격", "계열명": "관세사", "종목명": "관세사"},
        {"자격구분코드": "T", "자격구분명": "국가기술자격", "계열명": "정보처리", "종목명": "정보처리기사"},
        {"자격구분코드": "T", "자격구분명": "국가기술자격", "계열명": "정보처리", "종목명": "정보처리산업기사"},
        {"자격구분코드": "Q", "자격구분명": "과정평가형자격", "계열명": "용접", "종목명": "용접기능사"},
        {"자격구분코드": "D", "자격구분명": "일학습병행자격", "계열명": "기계", "종목명": "기계설계"},
    ]


@pytest.fixture
def sample_csv_file(sample_csv_data, tmp_path):
    """테스트용 임시 CSV 파일 생성."""
    csv_path = tmp_path / "credentials.csv"
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["자격구분코드", "자격구분명", "계열명", "종목명"])
        writer.writeheader()
        writer.writerows(sample_csv_data)
    return csv_path


class TestCategories:
    """카테고리 상수 테스트."""

    def test_categories_contains_all_expected(self):
        """모든 예상 카테고리가 정의되어 있는지 확인."""
        expected = ["국가전문자격", "국가기술자격", "과정평가형자격", "일학습병행자격"]
        for cat in expected:
            assert cat in CATEGORIES

    def test_categories_has_correct_codes(self):
        """카테고리별 코드가 올바른지 확인."""
        assert CATEGORIES["국가전문자격"]["code"] == "S"
        assert CATEGORIES["국가기술자격"]["code"] == "T"
        assert CATEGORIES["과정평가형자격"]["code"] == "Q"
        assert CATEGORIES["일학습병행자격"]["code"] == "D"


class TestGetCategoryFilename:
    """파일명 생성 함수 테스트."""

    def test_국가전문자격_filename(self):
        """국가전문자격 파일명."""
        assert get_category_filename("국가전문자격") == "national_professional"

    def test_국가기술자격_filename(self):
        """국가기술자격 파일명."""
        assert get_category_filename("국가기술자격") == "national_technical"

    def test_과정평가형자격_filename(self):
        """과정평가형자격 파일명."""
        assert get_category_filename("과정평가형자격") == "course_evaluation"

    def test_일학습병행자격_filename(self):
        """일학습병행자격 파일명."""
        assert get_category_filename("일학습병행자격") == "work_study"


class TestSplitCsvByCategory:
    """CSV 분리 함수 테스트."""

    def test_split_returns_dict_with_all_categories(self, sample_csv_file):
        """모든 카테고리에 대한 딕셔너리 반환."""
        result = split_csv_by_category(sample_csv_file)
        assert isinstance(result, dict)
        assert "국가전문자격" in result
        assert "국가기술자격" in result
        assert "과정평가형자격" in result
        assert "일학습병행자격" in result

    def test_split_correct_count_per_category(self, sample_csv_file):
        """카테고리별 개수가 올바른지 확인."""
        result = split_csv_by_category(sample_csv_file)
        assert len(result["국가전문자격"]) == 2
        assert len(result["국가기술자격"]) == 2
        assert len(result["과정평가형자격"]) == 1
        assert len(result["일학습병행자격"]) == 1

    def test_split_preserves_data_structure(self, sample_csv_file):
        """데이터 구조가 보존되는지 확인."""
        result = split_csv_by_category(sample_csv_file)
        cert = result["국가전문자격"][0]
        assert "code" in cert
        assert "category" in cert
        assert "series" in cert
        assert "title" in cert
        assert "raw_id" in cert


class TestSaveCategoryCsv:
    """CSV 저장 함수 테스트."""

    def test_save_creates_csv_file(self, sample_csv_file, tmp_path):
        """CSV 파일이 생성되는지 확인."""
        result = split_csv_by_category(sample_csv_file)
        output_path = tmp_path / "output" / "national_professional.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        save_category_csv(result["국가전문자격"], output_path)

        assert output_path.exists()

    def test_saved_csv_has_correct_content(self, sample_csv_file, tmp_path):
        """저장된 CSV 내용이 올바른지 확인."""
        result = split_csv_by_category(sample_csv_file)
        output_path = tmp_path / "output" / "national_professional.csv"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        save_category_csv(result["국가전문자격"], output_path)

        with open(output_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            assert len(rows) == 2
            assert rows[0]["title"] == "세무사"


class TestSaveCategoryJson:
    """JSON 저장 함수 테스트."""

    def test_save_creates_json_file(self, sample_csv_file, tmp_path):
        """JSON 파일이 생성되는지 확인."""
        result = split_csv_by_category(sample_csv_file)
        output_path = tmp_path / "output" / "national_professional.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        save_category_json(result["국가전문자격"], output_path)

        assert output_path.exists()

    def test_saved_json_has_correct_content(self, sample_csv_file, tmp_path):
        """저장된 JSON 내용이 올바른지 확인."""
        result = split_csv_by_category(sample_csv_file)
        output_path = tmp_path / "output" / "national_professional.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        save_category_json(result["국가전문자격"], output_path)

        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert len(data) == 2
            assert data[0]["title"] == "세무사"
