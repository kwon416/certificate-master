"""원본 CSV를 카테고리별로 분리하여 CSV/JSON 파일로 저장하는 스크립트.

사용법:
    uv run python -m scripts.split_by_category
    uv run python -m scripts.split_by_category --category 국가기술자격  # 특정 카테고리만
"""
import argparse
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


# 카테고리 정의
CATEGORIES: dict[str, dict[str, str]] = {
    "국가전문자격": {"code": "S", "filename": "national_professional"},
    "국가기술자격": {"code": "T", "filename": "national_technical"},
    "과정평가형자격": {"code": "Q", "filename": "course_evaluation"},
    "일학습병행자격": {"code": "D", "filename": "work_study"},
}


def get_category_filename(category: str) -> str:
    """카테고리명을 영문 파일명으로 변환한다."""
    if category not in CATEGORIES:
        raise ValueError(f"Unknown category: {category}")
    return CATEGORIES[category]["filename"]


def split_csv_by_category(csv_path: Path) -> dict[str, list[Certificate]]:
    """CSV 파일을 카테고리별로 분리한다."""
    result: dict[str, list[Certificate]] = {cat: [] for cat in CATEGORIES}

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = row["자격구분명"].strip()
            if category not in CATEGORIES:
                continue

            code = row["자격구분코드"].strip()
            title = row["종목명"].strip()

            cert: Certificate = {
                "code": code,
                "category": category,
                "series": row["계열명"].strip(),
                "title": title,
                "raw_id": f"{code}_{title}",
            }
            result[category].append(cert)

    return result


def save_category_csv(certificates: list[Certificate], output_path: Path) -> None:
    """자격증 목록을 CSV 파일로 저장한다."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["code", "category", "series", "title", "raw_id"]
        )
        writer.writeheader()
        writer.writerows(certificates)


def save_category_json(certificates: list[Certificate], output_path: Path) -> None:
    """자격증 목록을 JSON 파일로 저장한다."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(certificates, f, ensure_ascii=False, indent=2)


def main() -> None:
    """메인 함수."""
    parser = argparse.ArgumentParser(
        description="원본 CSV를 카테고리별로 분리하여 저장"
    )
    parser.add_argument(
        "--category",
        type=str,
        choices=list(CATEGORIES.keys()),
        default=None,
        help="특정 카테고리만 처리 (기본: 전체)",
    )
    args = parser.parse_args()

    # 경로 설정
    data_dir = Path(__file__).parent.parent / "data"
    csv_path = data_dir / "raw" / "credentials.csv"
    output_dir = data_dir / "processed" / "by_category"

    if not csv_path.exists():
        print(f"[오류] 파일을 찾을 수 없습니다: {csv_path}")
        return

    print(f"원본 CSV 파일: {csv_path}")
    print("카테고리별 분리 중...")

    # 분리
    categorized = split_csv_by_category(csv_path)

    # 처리할 카테고리 결정
    categories_to_process = [args.category] if args.category else list(CATEGORIES.keys())

    # 저장
    for category in categories_to_process:
        certs = categorized[category]
        filename = get_category_filename(category)

        csv_output = output_dir / f"{filename}.csv"
        json_output = output_dir / f"{filename}.json"

        save_category_csv(certs, csv_output)
        save_category_json(certs, json_output)

        print(f"  {category}: {len(certs)}건")
        print(f"    - {csv_output}")
        print(f"    - {json_output}")

    total = sum(len(categorized[c]) for c in categories_to_process)
    print(f"\n총 {total}건 처리 완료!")


if __name__ == "__main__":
    main()
