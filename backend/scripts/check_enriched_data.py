"""보강된 자격증 데이터를 점검하는 스크립트.

Supabase에서 MariaDB로 마이그레이션됨 (2026-01-21).
"""
import sys
from pathlib import Path

from sqlalchemy.orm import Session

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


def get_latest_enriched_certificate(session: Session) -> dict | None:
    """최신 보강된 자격증을 조회한다.

    Args:
        session: SQLAlchemy 세션

    Returns:
        보강된 자격증 딕셔너리 또는 None
    """
    result = (
        session.query(Certificate)
        .filter(Certificate.overview.isnot(None))
        .order_by(Certificate.updated_at.desc())
        .first()
    )

    if result:
        return result.to_dict()
    return None


def check_data():
    """보강된 데이터를 조회해 콘솔에 출력한다."""
    session = get_mariadb_session()

    try:
        cert_dict = get_latest_enriched_certificate(session)

        if not cert_dict:
            print("보강된 자격증이 없습니다.")
            return

        print("=" * 70)
        print(f"자격증: {cert_dict['title']}")
        print("=" * 70)

        overview = cert_dict.get("overview", "")
        print(f"\n[개요] (글자수 {len(overview or '')}):")
        print(overview or "정보 없음")

        print(f"\n[기본 정보]:")
        print(f"  난이도: {cert_dict.get('difficulty')}/5")
        print(f"  준비 기간: {cert_dict.get('study_period_days')}일")

        print(f"\n[시험 정보]:")
        exam_info = cert_dict.get("exam_info") or {}
        print(f"  과목: {exam_info.get('subjects', [])}")
        print(f"  유형: {exam_info.get('exam_type', '정보 없음')}")
        print(f"  합격 기준: {exam_info.get('passing_criteria', '정보 없음')}")

        print(f"\n[커리어 정보]:")
        career = cert_dict.get("career_info") or {}
        print(f"  전망:")
        print(f"    {career.get('job_prospects', '정보 없음')}")
        print(f"  연봉: {career.get('average_salary', '정보 없음')}")
        print(f"  관련 직무: {', '.join(career.get('related_jobs', []))}")

        print(f"\n[사용자 후기]:")
        reviews = cert_dict.get("user_reviews") or {}
        summary = reviews.get("summary", "정보 없음")
        print(f"  요약:")
        if len(summary) > 200:
            print(f"    {summary[:200]}...")
        else:
            print(f"    {summary}")
        print(f"  난이도 피드백:")
        print(f"    {reviews.get('difficulty_feedback', '정보 없음')}")

        lectures = cert_dict.get("recommended_lectures") or []
        print(f"\n[추천 강의] ({len(lectures)}개):")
        for idx, lecture in enumerate(lectures, 1):
            print(f"  [{idx}] {lecture.get('platform')} - {lecture.get('title')}")
            print(f"      URL: {lecture.get('url')}")
            print(f"      관련성 점수: {lecture.get('relevance_score', 0):.2f}")

        print(f"\n[공식 출처]:")
        sources = cert_dict.get("official_sources") or {}
        print(f"  사이트: {sources.get('official_site', '정보 없음')}")
        print(f"  기관: {sources.get('issuing_organization', '정보 없음')}")

        print("\n" + "=" * 70)

    finally:
        session.close()


if __name__ == "__main__":
    check_data()
