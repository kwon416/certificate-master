"""데이터 파이프라인: 자격증 보강 + 임베딩 생성 통합 스크립트.

Supabase에서 MariaDB로 마이그레이션됨 (2026-01-21).

동작 순서:
1. [Enrich] MariaDB에서 미보강 자격증 조회 → Brave 검색 → LLM 정제 → DB 업데이트
2. [Embedding] 보강된 자격증 조회 → 임베딩 생성 → ChromaDB 업로드

사용법:
    # 테스트 (1개만 처리)
    uv run python -m scripts.data_pipeline --test

    # 특정 개수만 처리
    uv run python -m scripts.data_pipeline --limit 10

    # 모든 미보강 자격증 처리
    uv run python -m scripts.data_pipeline --all

    # 보강만 실행 (임베딩 건너뛰기)
    uv run python -m scripts.data_pipeline --limit 10 --skip-embedding

    # 임베딩만 실행 (보강 건너뛰기)
    uv run python -m scripts.data_pipeline --limit 10 --skip-enrich

    # 이미 임베딩된 자격증 건너뛰기
    uv run python -m scripts.data_pipeline --all --skip-existing
"""
import argparse
import asyncio
import sys
from pathlib import Path
from typing import Optional

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


class DataPipeline:
    """데이터 파이프라인: 보강 → 임베딩 순서 실행."""

    def __init__(self):
        """파이프라인 초기화."""
        pass

    async def enrich_step(
        self,
        limit: Optional[int] = None,
    ) -> dict:
        """보강 단계 실행.

        Args:
            limit: 처리할 최대 자격증 수

        Returns:
            처리 결과 딕셔너리
        """
        from app.services.enrichment_service import get_enrichment_service

        print("\n" + "=" * 70)
        print("[STEP 1/2] 자격증 보강 (Enrich)")
        print("=" * 70)

        session = get_mariadb_session()

        try:
            # 미보강 자격증 조회
            query = session.query(Certificate).filter(Certificate.overview.is_(None))

            if limit:
                query = query.limit(limit)

            results = query.all()

            if not results:
                print("\n[확인] 보강할 자격증이 없습니다.")
                return {"processed": 0, "success": 0, "failed": 0}

            certificates = [cert.to_dict() for cert in results]
            print(f"\n미보강 자격증 {len(certificates)}개 발견")

            # 보강 실행
            service = get_enrichment_service(session)
            success = 0
            failed = 0

            for cert in certificates:
                try:
                    result = await service.enrich_certificate(cert["id"], cert["title"])
                    if result.get("status") == "success":
                        success += 1
                        print(f"  [성공] {cert['title']}")
                    else:
                        failed += 1
                        print(
                            f"  [실패] {cert['title']}: {result.get('error', '알 수 없는 오류')}"
                        )
                except Exception as e:
                    failed += 1
                    print(f"  [오류] {cert['title']}: {str(e)}")

            print(f"\n보강 완료: 성공 {success}, 실패 {failed}")
            return {"processed": len(certificates), "success": success, "failed": failed}

        finally:
            session.close()

    async def embedding_step(
        self,
        limit: Optional[int] = None,
        skip_existing: bool = False,
    ) -> dict:
        """임베딩 단계 실행.

        주의: 데이터 일관성 보장을 위해 vector_id가 없는 자격증은 limit과 관계없이 전부 처리됨.
        limit은 검증용 조회에만 적용됨.

        Args:
            limit: 검증용 조회 제한 (vector_id 없는 것은 전부 처리)
            skip_existing: 이미 임베딩된 자격증 건너뛰기

        Returns:
            처리 결과 딕셔너리
        """
        from app.services.vector_store import VectorStoreService

        print("\n" + "=" * 70)
        print("[STEP 2/2] 임베딩 생성 (Embedding)")
        print("=" * 70)

        session = get_mariadb_session()

        try:
            vector_store = VectorStoreService()

            # 1. vector_id가 없는 것: 전부 조회 (limit 무시 - 데이터 일관성 보장)
            # 보강된 자격증은 반드시 벡터 DB에 저장되어야 함
            query_without_vector = session.query(Certificate).filter(
                Certificate.overview.isnot(None),
                Certificate.vector_id.is_(None)
            )
            results_without = query_without_vector.all()  # 전부 조회

            # 2. vector_id가 있는 것: 검증용 조회 (limit 적용 가능)
            query_with_vector = session.query(Certificate).filter(
                Certificate.overview.isnot(None),
                Certificate.vector_id.isnot(None)
            )
            if limit and len(results_without) == 0:
                # vector_id 없는 것이 없을 때만 limit 적용 (검증용)
                results_with = query_with_vector.limit(limit).all()
            else:
                results_with = query_with_vector.all()

            certs_without_vector_id = [cert.to_dict() for cert in results_without]
            certs_with_vector_id = [cert.to_dict() for cert in results_with]
            all_certificates = certs_without_vector_id + certs_with_vector_id

            if not all_certificates:
                print("\n[확인] 보강된 자격증이 없습니다.")
                return {"processed": 0, "uploaded": 0, "skipped": 0}

            print(f"\n보강된 자격증 {len(all_certificates)}개 발견")
            print(f"  - MariaDB vector_id 없음: {len(certs_without_vector_id)}개")
            print(f"  - MariaDB vector_id 있음: {len(certs_with_vector_id)}개")

            # ==== 2단계: vector_id 없는 것 중 ChromaDB에 이미 존재하는지 확인 ====
            certs_to_sync_only = []  # ChromaDB에 있지만 MariaDB에 vector_id 없는 것
            certs_truly_missing = []  # ChromaDB에도 없는 것 → 새로 생성 필요

            if certs_without_vector_id:
                ids_to_check = [c["id"] for c in certs_without_vector_id]
                existing_in_chroma = set(vector_store.check_existing_vectors(ids_to_check))

                for cert in certs_without_vector_id:
                    if cert["id"] in existing_in_chroma:
                        # ChromaDB에 이미 존재 → vector_id만 동기화 필요
                        certs_to_sync_only.append(cert)
                    else:
                        # ChromaDB에도 없음 → 새로 생성 필요
                        certs_truly_missing.append(cert)

                if certs_to_sync_only:
                    print(f"  - [발견] ChromaDB에 이미 존재 (vector_id만 동기화 필요): {len(certs_to_sync_only)}개")
                if certs_truly_missing:
                    print(f"  - [발견] ChromaDB에 없음 (새로 생성 필요): {len(certs_truly_missing)}개")

            # ==== 3단계: ChromaDB에 있는 것은 vector_id만 동기화 ====
            synced_from_chroma = 0
            if certs_to_sync_only:
                print(f"\n  ChromaDB에 존재하는 {len(certs_to_sync_only)}개 자격증의 vector_id 동기화 중...")
                mappings = [(cert["id"], cert["id"]) for cert in certs_to_sync_only]
                sync_result = vector_store.sync_vector_ids_to_db_batch(mappings)
                synced_from_chroma = sync_result["success"]
                print(f"    - DB에 vector_id {synced_from_chroma}개 동기화 완료 [OK]")

            # ==== 4단계: vector_id가 있는 것 중 ChromaDB 검증 ====
            orphan_certs = []  # MariaDB에는 vector_id 있지만 ChromaDB에 없는 것
            already_synced = 0

            if certs_with_vector_id:
                ids_to_check = [c["vector_id"] for c in certs_with_vector_id]
                existing_in_chroma = set(vector_store.check_existing_vectors(ids_to_check))

                for cert in certs_with_vector_id:
                    if cert["vector_id"] in existing_in_chroma:
                        already_synced += 1
                    else:
                        # ChromaDB에 없음 → 다시 생성 필요
                        orphan_certs.append(cert)

                if orphan_certs:
                    print(f"  - [경고] ChromaDB에 없는 고아 레코드: {len(orphan_certs)}개 → 재생성 예정")

            # ==== 5단계: 처리 대상 결정 ====
            # ChromaDB에 없는 것 + 고아 레코드 (certs_to_sync_only는 이미 처리됨)
            certificates = certs_truly_missing + orphan_certs

            if not certificates:
                total_synced = already_synced + synced_from_chroma
                print(f"\n[완료] 모든 자격증이 이미 동기화됨 (기존 {already_synced}개 + 신규 동기화 {synced_from_chroma}개)")
                return {"processed": 0, "uploaded": 0, "skipped": total_synced, "synced_from_chroma": synced_from_chroma}

            print(f"\n처리 대상: {len(certificates)}개 (신규 {len(certs_truly_missing)} + 재생성 {len(orphan_certs)})")

            # ==== 6단계: 임베딩 생성 및 업로드 ====
            BATCH_SIZE = 32
            total_uploaded = 0
            total_synced = 0

            for i in range(0, len(certificates), BATCH_SIZE):
                batch = certificates[i : i + BATCH_SIZE]
                batch_num = (i // BATCH_SIZE) + 1
                total_batches = (len(certificates) + BATCH_SIZE - 1) // BATCH_SIZE

                print(f"\n  배치 {batch_num}/{total_batches} 처리 중 ({len(batch)}개)...")

                try:
                    # 처리 대상 출력
                    for cert in batch:
                        status = "재생성" if cert.get("vector_id") else "신규"
                        print(f"    [{status}] {cert['title']} (ID: {cert['id'][:8]}...)")

                    # BGE-M3 임베딩 + ChromaDB 업로드 + 검증 (skip_existing=True)
                    result = vector_store.upsert_certificates_batch_integrated(batch, skip_existing=True)

                    # 결과 출력
                    uploaded = result.get("uploaded_count", 0)
                    verified = result.get("verified_count", 0)
                    skipped = result.get("skipped_count", 0)
                    failed_ids = result.get("failed_ids", [])

                    if skipped > 0:
                        print(f"    - ChromaDB에 이미 존재: {skipped}개 스킵")

                    if verified > 0:
                        print(f"    - ChromaDB에 {verified}개 업로드 및 검증 완료 [OK]")
                        total_uploaded += verified

                    if failed_ids:
                        print(f"    - [경고] 검증 실패: {failed_ids[:3]}{'...' if len(failed_ids) > 3 else ''}")

                    # DB에 vector_id 동기화 (새로 업로드된 것만)
                    skipped_set = set(result.get("skipped_ids", []))
                    failed_set = set(failed_ids)
                    certs_to_sync = [
                        cert for cert in batch
                        if cert["id"] not in skipped_set and cert["id"] not in failed_set
                    ]

                    if certs_to_sync:
                        mappings = [(cert["id"], cert["id"]) for cert in certs_to_sync]
                        sync_result = vector_store.sync_vector_ids_to_db_batch(mappings)
                        sync_count = sync_result["success"]
                        total_synced += sync_count
                        print(f"    - DB에 vector_id {sync_count}개 동기화 완료")
                        if sync_result.get("not_found_ids"):
                            print(f"      [경고] DB에서 미발견: {len(sync_result['not_found_ids'])}개")

                except Exception as e:
                    print(f"    [오류] 배치 처리 실패: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    continue

            print(f"\n임베딩 완료: 업로드 {total_uploaded}개, 동기화 {total_synced}개, 기존 {already_synced}개, ChromaDB에서 복구 {synced_from_chroma}개")
            return {
                "processed": len(certificates),
                "uploaded": total_uploaded,
                "synced": total_synced,
                "skipped": already_synced,
                "synced_from_chroma": synced_from_chroma
            }

        finally:
            session.close()

    async def run(
        self,
        test_mode: bool = False,
        limit: Optional[int] = None,
        skip_enrich: bool = False,
        skip_embedding: bool = False,
        skip_existing: bool = False,
    ) -> dict:
        """파이프라인 전체 실행.

        Args:
            test_mode: True면 limit=1로 설정
            limit: 처리할 최대 자격증 수
            skip_enrich: True면 보강 단계 건너뛰기
            skip_embedding: True면 임베딩 단계 건너뛰기
            skip_existing: True면 이미 임베딩된 자격증 건너뛰기

        Returns:
            각 단계별 처리 결과
        """
        print("\n" + "=" * 70)
        print("데이터 파이프라인 시작")
        print("=" * 70)

        # test_mode면 limit=1
        if test_mode:
            limit = 1

        result = {"enrich": {}, "embedding": {}}

        # Step 1: Enrich
        if skip_enrich:
            print("\n[SKIP] 보강 단계 건너뛰기")
            result["enrich"] = {"skipped": True}
        else:
            result["enrich"] = await self.enrich_step(limit=limit)

        # Step 2: Embedding
        if skip_embedding:
            print("\n[SKIP] 임베딩 단계 건너뛰기")
            result["embedding"] = {"skipped_step": True}
        else:
            result["embedding"] = await self.embedding_step(
                limit=limit,
                skip_existing=skip_existing,
            )

        # 요약
        print("\n" + "=" * 70)
        print("파이프라인 완료")
        print("=" * 70)

        if not result["enrich"].get("skipped"):
            print(
                f"  보강: {result['enrich'].get('success', 0)}개 성공, "
                f"{result['enrich'].get('failed', 0)}개 실패"
            )

        if not result["embedding"].get("skipped_step"):
            emb = result["embedding"]
            print(f"  임베딩: 업로드 {emb.get('uploaded', 0)}개, 동기화 {emb.get('synced', 0)}개, 기존 {emb.get('skipped', 0)}개")

        return result


async def main():
    """메인 엔트리 포인트."""
    parser = argparse.ArgumentParser(
        description="자격증 보강 + 임베딩 생성 통합 파이프라인"
    )
    parser.add_argument(
        "--test", action="store_true", help="테스트 모드: 1개 자격증만 처리"
    )
    parser.add_argument("--limit", type=int, help="처리할 자격증 최대 개수")
    parser.add_argument("--all", action="store_true", help="모든 미보강 자격증 처리")
    parser.add_argument(
        "--skip-enrich", action="store_true", help="보강 단계 건너뛰기"
    )
    parser.add_argument(
        "--skip-embedding", action="store_true", help="임베딩 단계 건너뛰기"
    )
    parser.add_argument(
        "--skip-existing", action="store_true", help="이미 임베딩된 자격증 건너뛰기"
    )

    args = parser.parse_args()

    # 인자 검증
    if not (args.test or args.limit or args.all):
        parser.print_help()
        print("\n--test, --limit N 또는 --all 옵션을 지정하세요.")
        return

    pipeline = DataPipeline()

    try:
        await pipeline.run(
            test_mode=args.test,
            limit=args.limit if not args.all else None,
            skip_enrich=args.skip_enrich,
            skip_embedding=args.skip_embedding,
            skip_existing=args.skip_existing,
        )
    except KeyboardInterrupt:
        print("\n\n[경고] 사용자가 작업을 중단했습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[오류] {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
