"""Verify field mapping counts.

Supabase에서 MariaDB로 마이그레이션됨 (2026-01-21).

This script verifies that each field in FIELD_MAPPING matches
the expected number of certificates.
"""
import re
import sys
from pathlib import Path

from sqlalchemy.orm import Session

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_engine
from app.models.certificate import Certificate


def get_mariadb_session() -> Session:
    """MariaDB 세션을 생성한다."""
    from sqlalchemy.orm import sessionmaker

    engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


# Field mapping from recommendation_service.py
FIELD_MAPPING = {
    "IT개발": {
        "categories": ["국가기술자격"],
        "series_pattern": r"(정보|네트워크|보안|소프트웨어|데이터|웹|전자계산)",
        "expected_count": 50,
    },
    "제조기술": {
        "categories": ["국가기술자격"],
        "series_pattern": r"(기계|전기|전자|화공|금속|재료|용접|설비|공조|자동차)",
        "expected_count": 150,
    },
    "건설건축": {
        "categories": ["국가기술자격"],
        "series_pattern": r"(건축|토목|건설|도시|측량|조경|실내|구조)",
        "expected_count": 80,
    },
    "전문직": {
        "categories": ["국가전문자격"],
        "series_pattern": r"(세무사|변리사|노무사|관세사|감정평가사|지도사)",
        "expected_count": 20,
    },
    "사업서비스": {
        "categories": ["국가전문자격", "국가기술자격"],
        "series_pattern": r"(물류|유통|경영|관광|호텔|부동산|중개|문화|통역)",
        "expected_count": 40,
    },
    "안전환경": {
        "categories": ["국가기술자격", "국가전문자격"],
        "series_pattern": r"(안전|소방|가스|위험물|환경|대기|수질|폐기물)",
        "expected_count": 60,
    },
    "보건의료": {
        "categories": ["국가전문자격", "국가기술자격"],
        "series_pattern": r"(의료|보건|간호|위생|식품|영양|복지|약)",
        "expected_count": 30,
    },
    "기타실무": {
        "categories": ["국가기술자격"],
        "series_pattern": None,
        "expected_count": 169,
    },
}


def main():
    """Verify field mapping counts."""
    session = get_mariadb_session()

    try:
        print("=" * 80)
        print("Field Mapping Verification")
        print("=" * 80)
        print()

        # Get total excluding 일학습병행자격
        total_count = (
            session.query(Certificate)
            .filter(Certificate.category != "일학습병행자격")
            .count()
        )
        print(f"Total certificates (excluding 일학습병행자격): {total_count}")
        print()

        total_matched = 0
        results = []

        for field, config in FIELD_MAPPING.items():
            # Query with category filter
            query = session.query(Certificate).filter(
                Certificate.category != "일학습병행자격"
            )

            categories = config["categories"]
            if categories:
                query = query.filter(Certificate.category.in_(categories))

            certificates = query.all()

            # Apply series pattern filter in Python
            series_pattern = config["series_pattern"]
            if series_pattern:
                filtered = []
                for cert in certificates:
                    series = cert.series or ""
                    if re.search(series_pattern, series, re.IGNORECASE):
                        filtered.append(cert)
                certificates = filtered

            count = len(certificates)
            expected = config.get("expected_count", 0)
            diff = count - expected
            diff_pct = (diff / expected * 100) if expected > 0 else 0

            results.append(
                {
                    "field": field,
                    "count": count,
                    "expected": expected,
                    "diff": diff,
                    "diff_pct": diff_pct,
                }
            )
            total_matched += count

        # Print results
        print(
            f"{'Field':<15} {'Count':>8} {'Expected':>10} {'Diff':>8} {'Diff %':>10}"
        )
        print("-" * 80)

        for r in results:
            status = "OK" if abs(r["diff_pct"]) <= 20 else "WARN"
            print(
                f"{r['field']:<15} {r['count']:>8} {r['expected']:>10} "
                f"{r['diff']:>+8} {r['diff_pct']:>+9.1f}% {status}"
            )

        print("-" * 80)
        print(f"{'Total Matched':<15} {total_matched:>8} {total_count:>10}")
        print()

        # Check coverage
        coverage_pct = (total_matched / total_count * 100) if total_count > 0 else 0
        print(f"Coverage: {coverage_pct:.1f}%")

        if coverage_pct < 90:
            print("WARN Warning: Coverage is less than 90%")
        else:
            print("OK Good coverage!")

        print()
        print("=" * 80)

    finally:
        session.close()


if __name__ == "__main__":
    main()
