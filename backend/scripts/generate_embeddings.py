"""보강된 자격증 데이터를 ChromaDB에 업로드하는 스크립트.

BGE-M3 임베딩을 사용하여 텍스트를 벡터로 변환한 후 ChromaDB에 저장합니다.

사용법:
    # 첫 5개 테스트
    uv run python -m scripts.generate_embeddings --test

    # 특정 개수만 업로드
    uv run python -m scripts.generate_embeddings --limit 100

    # 모든 보강 완료 자격증 업로드
    uv run python -m scripts.generate_embeddings --all

    # 이미 업로드된 자격증 건너뛰기
    uv run python -m scripts.generate_embeddings --all --skip-existing
"""
import argparse
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_engine
from app.models.certificate import Certificate
from app.services.vector_store import VectorStoreService


def get_mariadb_session() -> Session:
    """MariaDB 세션을 생성한다."""
    from sqlalchemy.orm import sessionmaker

    engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def get_enriched_certificates(
    session: Session,
    limit: Optional[int] = None,
    skip_existing: bool = False,
) -> list[dict]:
    """보강된 자격증 목록을 조회한다.

    Args:
        session: SQLAlchemy 세션
        limit: 최대 조회 개수
        skip_existing: True면 이미 vector_id가 있는 자격증 건너뛰기

    Returns:
        자격증 딕셔너리 리스트
    """
    query = session.query(Certificate).filter(Certificate.overview.isnot(None))

    if skip_existing:
        query = query.filter(Certificate.vector_id.is_(None))

    if limit:
        query = query.limit(limit)

    results = query.all()
    return [cert.to_dict() for cert in results]


def upload_certificates_to_chromadb(
    limit: Optional[int] = None, skip_existing: bool = False
):
    """자격증 데이터를 ChromaDB에 업로드합니다 (BGE-M3 임베딩).

    Args:
        limit: 처리할 최대 자격증 수.
        skip_existing: True면 이미 업로드된 자격증 건너뜀.
    """
    print("=" * 70)
    print("ChromaDB 업로드 파이프라인 (BGE-M3 임베딩)")
    print("=" * 70)

    # Initialize services
    print("\n[1/4] 서비스 초기화 중...")

    session = get_mariadb_session()

    try:
        vector_store = VectorStoreService()
        print("  [OK] ChromaDB 연결 성공")
    except Exception as e:
        print(f"  [ERROR] ChromaDB 연결 실패: {e}")
        print("\n다음 명령어로 ChromaDB 컬렉션을 먼저 설정하세요:")
        print("  uv run python -m scripts.setup_chromadb")
        session.close()
        return

    try:
        # Fetch enriched certificates from MariaDB
        print("\n[2/4] MariaDB에서 보강된 자격증 조회 중...")

        if skip_existing:
            print("  (--skip-existing: vector_id가 없는 자격증만 조회)")

        certificates = get_enriched_certificates(
            session, limit=limit, skip_existing=skip_existing
        )

        if not certificates:
            print("\n[완료] 업로드할 자격증이 없습니다.")
            return

        print(f"  {len(certificates)}개의 보강된 자격증을 찾았습니다.")

        # Upload to ChromaDB using BGE-M3 Embedding
        print(f"\n[3/4] ChromaDB에 업로드 중 (BGE-M3 임베딩)...")
        print("  -> 텍스트를 BGE-M3로 임베딩 후 ChromaDB에 저장")

        BATCH_SIZE = 32  # BGE-M3 배치 크기와 동일
        total_processed = 0

        for i in range(0, len(certificates), BATCH_SIZE):
            batch = certificates[i : i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(certificates) + BATCH_SIZE - 1) // BATCH_SIZE

            print(
                f"\n  배치 {batch_num}/{total_batches} 처리 중 "
                f"({len(batch)}개 자격증)..."
            )

            try:
                # BGE-M3 임베딩 + ChromaDB 업로드
                vector_store.upsert_certificates_batch_integrated(batch)
                print(f"    [OK] ChromaDB에 {len(batch)}개 업로드 완료")
                total_processed += len(batch)

                # DB에 vector_id 동기화
                mappings = [(cert["id"], cert["id"]) for cert in batch]
                sync_count = vector_store.sync_vector_ids_to_db_batch(mappings)
                print(f"    [OK] DB에 vector_id {sync_count}개 동기화 완료")

            except Exception as e:
                print(f"    [ERROR] 업로드 오류: {e}")
                continue

        # Summary
        print("\n" + "=" * 70)
        print("요약")
        print("=" * 70)
        print(f"총 처리: {total_processed}/{len(certificates)}")
        print(f"성공률: {100 * total_processed / len(certificates):.1f}%")

        # Verify by searching
        print("\n[4/4] ChromaDB 검색 검증 중...")
        try:
            if certificates:
                first_cert = certificates[0]
                results = vector_store.search_records(
                    namespace="certificates",
                    query=f"{first_cert['title']} {first_cert.get('category', '')}",
                    top_k=5,
                )

                print(f"  [OK] 검색 성공, 유사 자격증 {len(results)}개 반환")
                if results:
                    print(
                        f"  최상위 결과: {results[0]['metadata'].get('title', 'N/A')} "
                        f"(점수: {results[0]['score']:.3f})"
                    )
        except Exception as e:
            print(f"  [ERROR] 검색 검증 실패: {e}")

        print("\n완료!")

    finally:
        session.close()


def test_mode():
    """테스트 모드: 첫 5개 자격증 처리."""
    print("\n[TEST] 테스트 모드: 첫 5개 자격증 처리\n")
    upload_certificates_to_chromadb(limit=5)


def main():
    """메인 진입점."""
    parser = argparse.ArgumentParser(
        description="자격증 데이터를 ChromaDB에 업로드합니다 (BGE-M3 임베딩)"
    )
    parser.add_argument(
        "--test", action="store_true", help="테스트 모드: 첫 5개 자격증만 처리"
    )
    parser.add_argument("--limit", type=int, help="처리할 자격증 최대 개수")
    parser.add_argument("--all", action="store_true", help="보강된 모든 자격증 처리")
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="이미 ChromaDB에 있는 자격증은 건너뛰기",
    )

    args = parser.parse_args()

    if args.test:
        test_mode()
    elif args.all:
        upload_certificates_to_chromadb(limit=None, skip_existing=args.skip_existing)
    elif args.limit:
        upload_certificates_to_chromadb(
            limit=args.limit, skip_existing=args.skip_existing
        )
    else:
        parser.print_help()
        print("\n--test, --limit N 또는 --all 옵션을 지정하세요.")


if __name__ == "__main__":
    main()
