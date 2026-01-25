"""Unit tests for RAG-based recommendation service (intent-first flow)."""
import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime


class TestRAGRecommendationService:
    """Test RAG-based recommendation service."""

    @pytest.fixture
    def mock_embedding_service(self):
        """Mock embedding service."""
        service = Mock()
        service.create_embedding = AsyncMock(return_value=[0.1] * 3072)
        return service

    @pytest.fixture
    def mock_vector_store(self):
        """Mock vector store service."""
        store = Mock()
        store.search_records = Mock(return_value=[
            {
                "id": "cert-001",
                "score": 0.85,  # Strong match
                "metadata": {
                    "title": "정보처리기사",
                    "category": "국가기술자격",
                    "series": "정보기술",
                    "overview": "소프트웨어 개발 및 IT 분야 전문가",
                    "difficulty": 3,
                    "study_period_days": 90,
                }
            },
            {
                "id": "cert-002",
                "score": 0.72,  # Good match
                "metadata": {
                    "title": "네트워크관리사",
                    "category": "국가기술자격",
                    "series": "정보기술",
                    "overview": "네트워크 구축 및 관리 전문가",
                    "difficulty": 2,
                    "study_period_days": 60,
                }
            },
            {
                "id": "cert-003",
                "score": 0.55,  # Moderate match
                "metadata": {
                    "title": "컴퓨터활용능력",
                    "category": "국가기술자격",
                    "series": "정보기술",
                    "overview": "사무 자동화 능력",
                    "difficulty": 1,
                    "study_period_days": 30,
                }
            },
            {
                "id": "cert-004",
                "score": 0.45,  # Low match - should be filtered
                "metadata": {
                    "title": "워드프로세서",
                    "category": "국가기술자격",
                    "series": "사무관리",
                    "overview": "문서 작성 능력",
                    "difficulty": 1,
                    "study_period_days": 15,
                }
            },
        ])
        return store

    @pytest.fixture
    def mock_db_session(self):
        """Mock SQLAlchemy Session."""
        session = Mock()

        # Mock certificate model objects
        cert1 = Mock()
        cert1.to_dict.return_value = {
            "id": "cert-001",
            "raw_id": "T_정보처리기사",
            "code": "T",
            "category": "국가기술자격",
            "series": "정보기술",
            "title": "정보처리기사",
            "overview": "소프트웨어 개발 및 IT 분야 전문가",
            "difficulty": 3,
            "study_period_days": 90,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        cert2 = Mock()
        cert2.to_dict.return_value = {
            "id": "cert-002",
            "raw_id": "T_네트워크관리사",
            "code": "T",
            "category": "국가기술자격",
            "series": "정보기술",
            "title": "네트워크관리사",
            "overview": "네트워크 구축 및 관리 전문가",
            "difficulty": 2,
            "study_period_days": 60,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        cert3 = Mock()
        cert3.to_dict.return_value = {
            "id": "cert-003",
            "raw_id": "T_컴퓨터활용능력",
            "code": "T",
            "category": "국가기술자격",
            "series": "정보기술",
            "title": "컴퓨터활용능력",
            "overview": "사무 자동화 능력",
            "difficulty": 1,
            "study_period_days": 30,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        # Mock SQLAlchemy query chain
        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.all.return_value = [cert1, cert2, cert3]
        query_mock.filter.return_value = filter_mock
        session.query.return_value = query_mock

        return session

    def _build_request(self, RecommendationRequest):
        return RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발", "데이터"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            user_summary="데이터 분석 이직을 준비 중입니다.",
        )

    @pytest.mark.asyncio
    async def test_rag_search_creates_query_from_user_context(
        self,
        mock_embedding_service,
        mock_vector_store,
        mock_db_session
    ):
        """Test that RAG search creates query text from user context."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = self._build_request(RecommendationRequest)

        await service.get_recommendations(request)

        # ChromaDB search_records가 올바른 쿼리 텍스트로 호출되었는지 확인
        mock_vector_store.search_records.assert_called_once()
        call_args = mock_vector_store.search_records.call_args
        query_text = call_args[1]['query']

        assert "취업" in query_text
        assert "IT개발" in query_text or "데이터" in query_text
        assert "6개월 이하" in query_text
        assert "중간" in query_text
        assert "데이터 분석 이직" in query_text

    @pytest.mark.asyncio
    async def test_rag_search_queries_vector_store(
        self,
        mock_embedding_service,
        mock_vector_store,
        mock_db_session
    ):
        """Test that RAG search queries ChromaDB vector store with top_k=5."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = self._build_request(RecommendationRequest)

        response = await service.get_recommendations(request)

        mock_vector_store.search_records.assert_called_once()
        call_args = mock_vector_store.search_records.call_args
        assert call_args[1]['top_k'] == 5
        assert len(response.recommendations) > 0

    @pytest.mark.asyncio
    async def test_rag_search_fetches_full_certificate_data(
        self,
        mock_embedding_service,
        mock_vector_store,
        mock_db_session
    ):
        """Test that RAG search fetches full certificate data and filters by score >= 0.5."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = self._build_request(RecommendationRequest)

        response = await service.get_recommendations(request)

        # SQLAlchemy query가 호출되었는지 확인
        mock_db_session.query.assert_called()
        assert len(response.recommendations) == 3
        assert response.recommendations[0].certificate.title == "정보처리기사"

        for rec in response.recommendations:
            assert rec.qualification_category == rec.certificate.category
            assert rec.match_score >= 50

    @pytest.mark.asyncio
    async def test_rag_search_uses_vector_similarity_score(
        self,
        mock_embedding_service,
        mock_vector_store,
        mock_db_session
    ):
        """Test that RAG search uses vector similarity score for match_score."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = self._build_request(RecommendationRequest)

        response = await service.get_recommendations(request)

        scores = [rec.match_score for rec in response.recommendations]
        # Similarity 기반 점수가 하드 필터 보정(최대 +10)으로 상승할 수 있음
        assert scores[0] >= 85
        assert scores[1] >= 72
        assert scores[2] >= 55
        assert (
            scores[0] >= scores[1] >= scores[2]
        )

    @pytest.mark.asyncio
    async def test_rag_search_returns_top_k_results(
        self,
        mock_embedding_service,
        mock_vector_store,
        mock_db_session
    ):
        """Test that RAG search returns filtered results (score >= 0.5)."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = self._build_request(RecommendationRequest)

        response = await service.get_recommendations(request)

        assert len(response.recommendations) == 3
        assert response.total_matched == 3

    @pytest.mark.asyncio
    async def test_rag_search_handles_empty_results(
        self,
        mock_embedding_service,
        mock_db_session
    ):
        """Test that RAG search handles empty results gracefully."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        mock_vector_store_empty = Mock()
        mock_vector_store_empty.search_records = Mock(return_value=[])

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store_empty

        request = self._build_request(RecommendationRequest)

        response = await service.get_recommendations(request)

        assert len(response.recommendations) == 0
        assert response.total_matched == 0

    def test_fetch_certificates_by_ids_is_sync(self, mock_db_session):
        """Test that _fetch_certificates_by_ids is a synchronous function.

        B1 Critical Issue: async 함수에서 동기 SQLAlchemy 호출 방지.
        _fetch_certificates_by_ids는 동기 함수여야 이벤트 루프를 블로킹하지 않습니다.
        """
        import asyncio
        from app.services.recommendation_service import RecommendationService

        service = RecommendationService(db=mock_db_session)

        # _fetch_certificates_by_ids가 코루틴(async)이 아닌 일반 함수인지 확인
        result = service._fetch_certificates_by_ids(["cert-001"])

        # 결과가 코루틴이 아닌 리스트여야 함 (동기 함수)
        assert not asyncio.iscoroutine(result), \
            "_fetch_certificates_by_ids should be sync, not async"
        assert isinstance(result, list)

    def test_fetch_certificates_by_ids_returns_empty_for_empty_input(
        self, mock_db_session
    ):
        """Test that _fetch_certificates_by_ids returns empty list for empty input."""
        from app.services.recommendation_service import RecommendationService

        service = RecommendationService(db=mock_db_session)

        result = service._fetch_certificates_by_ids([])

        assert result == []
        # DB 쿼리가 호출되지 않아야 함
        mock_db_session.query.assert_not_called()

    @pytest.mark.asyncio
    async def test_no_fallback_when_constraints_filter_all_results(
        self,
        mock_embedding_service,
        mock_db_session
    ):
        """Test that no fallback is used when constraints filter all results.

        B3 Critical Issue: 제약조건에 맞는 결과가 없을 때 폴백하지 않고
        빈 결과를 반환해야 합니다. 사용자가 "3개월 이하"를 선택했는데
        1년짜리 자격증을 추천하면 안 됩니다.
        """
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        # Mock vector store: 모든 결과가 1년 이상 준비기간
        mock_vector_store = Mock()
        mock_vector_store.search_records = Mock(return_value=[
            {
                "id": "cert-long-1",
                "score": 0.95,
                "metadata": {
                    "title": "장기 준비 자격증1",
                    "category": "국가기술자격",
                    "series": "IT",
                    "difficulty": 5,
                    "study_period_days": 365,  # 1년
                }
            },
            {
                "id": "cert-long-2",
                "score": 0.90,
                "metadata": {
                    "title": "장기 준비 자격증2",
                    "category": "국가기술자격",
                    "series": "IT",
                    "difficulty": 4,
                    "study_period_days": 300,  # 10개월
                }
            },
        ])

        # Mock DB: 자격증 데이터
        cert1 = Mock()
        cert1.to_dict.return_value = {
            "id": "cert-long-1",
            "title": "장기 준비 자격증1",
            "category": "국가기술자격",
            "study_period_days": 365,
            "difficulty": 5,
        }
        cert2 = Mock()
        cert2.to_dict.return_value = {
            "id": "cert-long-2",
            "title": "장기 준비 자격증2",
            "category": "국가기술자격",
            "study_period_days": 300,
            "difficulty": 4,
        }

        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.all.return_value = [cert1, cert2]
        query_mock.filter.return_value = filter_mock
        mock_db_session.query.return_value = query_mock

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        # 사용자가 "3개월 이하" 제약조건 선택
        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",  # 90일 이하만 원함
            difficulty_preference="쉬운 편",
            user_summary="빠르게 자격증을 따고 싶습니다.",
        )

        response = await service.get_recommendations(request)

        # 폴백 없이 빈 결과 반환해야 함
        assert len(response.recommendations) == 0
        assert response.total_matched == 0
        # 쿼리 요약에 안내 메시지 포함 확인 (선택적)

    @pytest.mark.asyncio
    async def test_returns_results_when_some_match_constraints(
        self,
        mock_embedding_service,
        mock_db_session
    ):
        """Test that matching results are returned when some satisfy constraints."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        mock_vector_store = Mock()
        mock_vector_store.search_records = Mock(return_value=[
            {
                "id": "cert-short",
                "score": 0.80,
                "metadata": {
                    "title": "단기 자격증",
                    "category": "국가기술자격",
                    "series": "IT",
                    "difficulty": 2,
                    "study_period_days": 60,  # 2개월 - 제약조건 충족
                }
            },
            {
                "id": "cert-long",
                "score": 0.95,
                "metadata": {
                    "title": "장기 자격증",
                    "category": "국가기술자격",
                    "series": "IT",
                    "difficulty": 5,
                    "study_period_days": 365,  # 1년 - 제약조건 불충족
                }
            },
        ])

        cert_short = Mock()
        cert_short.to_dict.return_value = {
            "id": "cert-short",
            "raw_id": "T_단기자격증",
            "code": "T",
            "title": "단기 자격증",
            "category": "국가기술자격",
            "series": "IT",
            "overview": "단기 준비 자격증입니다.",
            "study_period_days": 60,
            "difficulty": 2,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        cert_long = Mock()
        cert_long.to_dict.return_value = {
            "id": "cert-long",
            "raw_id": "T_장기자격증",
            "code": "T",
            "title": "장기 자격증",
            "category": "국가기술자격",
            "series": "IT",
            "overview": "장기 준비 자격증입니다.",
            "study_period_days": 365,
            "difficulty": 5,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        query_mock = Mock()
        filter_mock = Mock()
        filter_mock.all.return_value = [cert_short, cert_long]
        query_mock.filter.return_value = filter_mock
        mock_db_session.query.return_value = query_mock

        service = RecommendationService(db=mock_db_session)
        service.embedding_service = mock_embedding_service
        service.vector_store = mock_vector_store

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            user_summary="빠르게 자격증을 따고 싶습니다.",
        )

        response = await service.get_recommendations(request)

        # cert-short만 반환 (제약조건 충족)
        assert len(response.recommendations) == 1
        assert response.recommendations[0].certificate.title == "단기 자격증"
        assert response.total_matched == 1


class TestVectorFilterBuilding:
    """B6: ChromaDB 메타데이터 필터 테스트."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock SQLAlchemy Session."""
        return Mock()

    def test_build_vector_filter_with_difficulty(self, mock_db_session):
        """난이도 제약조건이 있을 때 필터 생성 테스트."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="상관없음",
            difficulty_preference="쉬운 편",  # max_difficulty = 2
            user_summary="",
        )

        filter_dict = service._build_vector_filter(request)

        # B6: ChromaDB where 필터 생성
        assert filter_dict is not None
        assert "difficulty" in str(filter_dict)

    def test_build_vector_filter_with_timeline(self, mock_db_session):
        """학습 기간 제약조건이 있을 때 필터 생성 테스트."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",  # max_study_days = 90
            difficulty_preference="어려워도 상관없음",
            user_summary="",
        )

        filter_dict = service._build_vector_filter(request)

        # B6: ChromaDB where 필터 생성
        assert filter_dict is not None
        assert "study_period_days" in str(filter_dict)

    def test_build_vector_filter_no_constraints(self, mock_db_session):
        """제약조건이 없을 때 None 반환 테스트."""
        from app.services.recommendation_service import RecommendationService
        from app.schemas.recommendation import RecommendationRequest

        service = RecommendationService(db=mock_db_session)

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="상관없음",
            difficulty_preference="어려워도 상관없음",
            user_summary="",
        )

        filter_dict = service._build_vector_filter(request)

        # 제약조건이 없으면 None
        assert filter_dict is None
