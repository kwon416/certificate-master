"""한국 자격증 CSV 데이터를 파싱해 JSON으로 저장하는 스크립트."""
import csv
import json
from pathlib import Path
from typing import TypedDict


class Certificate(TypedDict):
    """파싱된 자격증 데이터 타입 정의."""

    code: str
    category: str
    series: str
    title: str
    raw_id: str


def parse_csv_to_json(csv_path: Path) -> list[Certificate]:
    """CSV 파일을 파싱해 자격증 목록을 반환한다."""
    certificates: list[Certificate] = []

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["자격구분코드"].strip()
            title = row["종목명"].strip()

            cert: Certificate = {
                "code": code,
                "category": row["자격구분명"].strip(),
                "series": row["계열명"].strip(),
                "title": title,
                "raw_id": f"{code}_{title}",
            }
            certificates.append(cert)

    return certificates


def save_to_json(certificates: list[Certificate], output_path: Path) -> None:
    """자격증 목록을 JSON 파일로 저장한다."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(certificates, f, ensure_ascii=False, indent=2)


def main() -> None:
    """CSV를 파싱해 JSON으로 저장하는 메인 함수."""
    # Define paths - now data is inside backend/
    data_dir = Path(__file__).parent.parent / "data"
    csv_path = data_dir / "raw" / "credentials.csv"
    output_path = data_dir / "processed" / "certificates_parsed.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Parse and save
    certificates = parse_csv_to_json(csv_path)
    save_to_json(certificates, output_path)

    print(f"{len(certificates)}개의 자격증을 파싱했습니다.")
    print(f"출력 파일: {output_path}")


if __name__ == "__main__":
    main()
