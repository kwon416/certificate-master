"""자격증 추천 서비스.

RAG (Retrieval-Augmented Generation) 기반 의미 검색 추천.
ChromaDB와 BGE-M3를 활용한 벡터 유사도 검색.

MariaDB(SQLAlchemy)로 마이그레이션됨 (2026-01-22).
"""
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.certificate import Certificate as CertificateModel
from app.schemas.certificate import Certificate
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendedCertificate,
    RecommendationResponse,
    Feasibility,
    QuickStats,
    StudyInsights,
)
from app.services.embedding.service import EmbeddingService
from app.services.embedding.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


STUDY_TIMELINE_DAYS: dict[str, int | None] = {
    "3개월 이하": 90,
    "6개월 이하": 180,
    "1년 이하": 365,
    "1년 이상": None,     # no upper bound
    "상관없음": None,      # no constraint
}

AVAILABLE_DAYS: dict[str, int] = {
    "3개월 이하": 90,
    "6개월 이하": 180,
    "1년 이하": 365,
    "1년 이상": 365 * 2,
    "상관없음": 365 * 2,
}

DIFFICULTY_LIMITS: dict[str, int | None] = {
    "쉬운 편": 2,
    "중간": 3,
    "어려워도 상관없음": None,
}

# B7: config에서 로드 (하드코딩 제거)
from app.core.config import get_settings

_settings = get_settings()
MIN_SIMILARITY_SCORE = _settings.RECOMMENDATION_MIN_SIMILARITY_SCORE
RECOMMENDATION_TOP_K = _settings.RECOMMENDATION_TOP_K


class RecommendationService:
    """RAG 기반 자격증 추천을 생성하는 서비스."""

    def __init__(
        self,
        db: Session,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStoreService] = None
    ):
        """SQLAlchemy 세션과 RAG 서비스로 초기화합니다.

        Args:
            db: SQLAlchemy 데이터베이스 세션.
            embedding_service: 임베딩 생성 서비스 (선택).
            vector_store: ChromaDB 벡터 스토어 서비스 (선택).
        """
        self.db = db
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or VectorStoreService()

    async def get_recommendations(
        self, request: RecommendationRequest
    ) -> RecommendationResponse:
        """RAG 기반 자격증 추천을 생성합니다.

        벡터 유사도 검색을 통해 사용자 맥락에 가장 적합한 자격증을 추천합니다.

        Args:
            request: 사용자 추천 요청(맥락 포함).

        Returns:
            매칭된 자격증과 이유를 담은 RecommendationResponse.
        """
        logger.info(f"[RAG] Generating recommendations for: {request.model_dump()}")

        constraints = self._build_constraints(request)

        # Step 1: Build query text from user context
        query_text = self._build_query_text(request)
        logger.info(f"[RAG] Query text: {query_text}")

        # Step 2: Search vector store using BGE-M3 Embedding
        # ChromaDB에서 BGE-M3 임베딩으로 쿼리 텍스트를 자동으로 임베딩합니다
        similar_results = self.vector_store.search_records(
            namespace=VectorStoreService.NAMESPACE,
            query=query_text,
            top_k=RECOMMENDATION_TOP_K,  # B7: config에서 로드
            filter_dict=self._build_vector_filter(request),
        )
        logger.info(f"[RAG] Found {len(similar_results)} similar certificates (Integrated Embedding)")

        similarity_results = self._filter_by_similarity(similar_results)

        if not similarity_results:
            # No results found above threshold
            return RecommendationResponse(
                recommendations=[],
                query_summary=self._generate_query_summary(request),
                user_summary=request.user_summary,
                total_matched=0,
            )

        # Step 4: Fetch full certificate data from MariaDB (동기 호출)
        cert_ids = [result["id"] for result in similarity_results]
        certificates = self._fetch_certificates_by_ids(cert_ids)
        logger.info(f"[RAG] Fetched {len(certificates)} full certificate records")
        # Step 4.5: Apply structured constraints (timeline/difficulty)
        constrained_certificates = self._apply_constraints(certificates, constraints)
        allowed_ids = {cert["id"] for cert in constrained_certificates}
        filtered_results = [
            result for result in similarity_results if result["id"] in allowed_ids
        ]

        logger.info(
            f"[RAG] After applying constraints: {len(filtered_results)} certificates remain"
        )

        # B3 수정: 제약조건에 맞는 결과가 없으면 빈 결과 반환 (폴백 제거)
        # 사용자가 선택한 제약조건을 무시하고 폴백하면 안 됨
        if not filtered_results:
            return RecommendationResponse(
                recommendations=[],
                query_summary=self._generate_query_summary(request),
                user_summary=request.user_summary,
                total_matched=0,
            )

        # Step 5: Generate recommendations with vector similarity scores
        recommendations = self._generate_recommendations_from_vector_results(
            filtered_results, constrained_certificates, request, constraints
        )

        # Step 6: Generate query summary
        query_summary = self._generate_query_summary(request)

        return RecommendationResponse(
            recommendations=recommendations,  # Already filtered and sorted
            query_summary=query_summary,
            user_summary=request.user_summary,  # 사용자 원본 요청 전달
            total_matched=len(filtered_results),
        )

    def _filter_by_similarity(self, results: list[dict]) -> list[dict]:
        """유사도 점수 기반 필터링을 적용합니다."""
        if not results:
            return []

        filtered_results = [
            result for result in results
            if result["score"] >= MIN_SIMILARITY_SCORE
        ]

        if filtered_results:
            logger.info(
                f"[RAG] After filtering (score >= {MIN_SIMILARITY_SCORE}): "
                f"{len(filtered_results)} certificates"
            )
            return filtered_results

        top_result = max(results, key=lambda r: r["score"])
        logger.info(
            f"[RAG] No matches above {MIN_SIMILARITY_SCORE}; "
            f"returning top result with score {top_result['score']:.4f} for fallback."
        )
        return [top_result]

    def _build_constraints(self, request: RecommendationRequest) -> dict[str, Any]:
        """사용자 입력을 기반으로 하드 필터 기준을 계산합니다."""
        return {
            "max_study_days": STUDY_TIMELINE_DAYS.get(request.study_timeline),
            "max_difficulty": DIFFICULTY_LIMITS.get(request.difficulty_preference),
        }

    def _apply_constraints(
        self,
        certificates: list[dict[str, Any]],
        constraints: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """타임라인/난이도 제약을 만족하는 자격증만 남깁니다."""
        max_days = constraints.get("max_study_days")
        max_difficulty = constraints.get("max_difficulty")

        filtered = []
        for cert in certificates:
            within_timeline = True
            within_difficulty = True

            if max_days is not None and cert.get("study_period_days"):
                within_timeline = cert["study_period_days"] <= max_days

            if max_difficulty is not None and cert.get("difficulty"):
                within_difficulty = cert["difficulty"] <= max_difficulty

            if within_timeline and within_difficulty:
                filtered.append(cert)

        return filtered

    def _generate_reason(
        self, cert: Certificate, request: RecommendationRequest
    ) -> str:
        """자격증 추천 사유를 생성합니다.

        분야 연관성, 진로 전망, 목적 기반으로 설득력 있는 추천 사유를 생성합니다.

        Args:
            cert: 자격증 객체.
            request: 사용자 추천 요청.

        Returns:
            추천 사유 문자열.
        """
        parts = []

        # 1. 분야 연관성 + 인정도
        if request.interest_domains:
            domain_text = ", ".join(request.interest_domains[:2])
            if cert.series:
                parts.append(f"{domain_text} 분야에서 {cert.series} 계열의 핵심 자격증입니다.")
            else:
                parts.append(f"{domain_text} 분야에서 인정받는 자격증입니다.")

        # 2. 진로 전망
        career_info = cert.career_info or {}
        job_prospects = career_info.get("job_prospects")
        if job_prospects:
            # 전망이 너무 길면 앞부분만 사용
            prospects = job_prospects[:60] + "..." if len(job_prospects) > 60 else job_prospects
            parts.append(prospects)

        # 3. 관련 직업 활용
        related_jobs = career_info.get("related_jobs", [])
        if related_jobs and len(parts) < 3:
            jobs_text = ", ".join(related_jobs[:2])
            parts.append(f"{jobs_text} 등의 직업에서 활용됩니다.")

        # 4. 목적 기반 문구
        purpose_phrases = {
            "취업": "취업 시 경쟁력을 높여줍니다.",
            "이직": "이직 시 전문성을 증명하는 데 도움됩니다.",
            "커리어 전문성 강화": "전문성을 체계적으로 증명하기 좋습니다.",
            "개인 관심 / 교양": "관심 분야를 깊이 있게 학습할 수 있습니다.",
            "창업 / 실무 활용": "실무에 바로 활용할 수 있는 역량을 갖출 수 있습니다.",
        }
        if request.purpose in purpose_phrases and len(parts) < 3:
            parts.append(purpose_phrases[request.purpose])

        # 5. 준비 기간 여유도
        if cert.study_period_days and request.study_timeline:
            available_days = AVAILABLE_DAYS.get(request.study_timeline, 365)
            study_days = cert.study_period_days
            if study_days <= available_days * 0.7:
                months = max(1, study_days // 30)
                parts.append(f"약 {months}개월 준비로 목표 기간 내 충분한 여유가 있습니다.")
            elif study_days <= available_days:
                parts.append(f"목표 기간 내 준비 가능합니다.")

        return " ".join(filter(None, parts[:3]))  # 최대 3문장

    def _generate_key_points(
        self, cert: Certificate, request: RecommendationRequest
    ) -> list[str]:
        """자격증 추천 핵심 포인트를 생성합니다.

        난이도, 학습 팁, 준비 기간, 관련 직업/활용 분야 위주로
        핵심 포인트를 제공합니다.

        Args:
            cert: 자격증 객체.
            request: 사용자 추천 요청.

        Returns:
            핵심 포인트 목록(최대 5개).
        """
        points: list[str] = []

        # 1. 난이도 문구
        if cert.difficulty:
            difficulty_labels = {
                1: "초급 난이도로 입문자에게 적합",
                2: "중하 난이도로 기초 지식으로 도전 가능",
                3: "중급 난이도로 체계적 학습 필요",
                4: "중상 난이도로 전문 학습 필요",
                5: "고급 난이도로 장기 준비 필요",
            }
            label = difficulty_labels.get(cert.difficulty, "")
            if label:
                points.append(label)

        # 2. 학습 팁 (user_reviews.study_tips에서 첫 번째)
        user_reviews = cert.user_reviews or {}
        study_tips = user_reviews.get("study_tips", [])
        if study_tips and len(study_tips) > 0:
            tip = study_tips[0]
            # 팁이 너무 길면 줄임
            if len(tip) > 40:
                tip = tip[:40] + "..."
            points.append(f"학습 팁: {tip}")

        # 3. 준비 기간
        if cert.study_period_days:
            days = cert.study_period_days
            if days <= 30:
                points.append("약 1개월 준비 기간")
            elif days <= 60:
                points.append("약 1-2개월 준비 기간")
            elif days <= 90:
                points.append("약 3개월 준비 기간")
            elif days <= 180:
                points.append("약 6개월 준비 기간")
            else:
                months = days // 30
                points.append(f"약 {months}개월 준비 기간")

        # 4. 관련 직업
        career_info = cert.career_info or {}
        if career_info.get("related_jobs"):
            jobs = career_info["related_jobs"][:2]
            points.append(f"관련 직업: {', '.join(jobs)}")

        # 5. 활용 분야
        if len(points) < 5 and career_info.get("use_cases"):
            use_cases = career_info["use_cases"][:2]
            points.append(f"활용 분야: {', '.join(use_cases)}")

        # 기본값
        if not points:
            points.append(f"{request.purpose} 목표에 도움이 되는 선택")

        return points[:5]  # 최대 5개

    def _calculate_feasibility(
        self, cert: Certificate, request: RecommendationRequest
    ) -> Feasibility:
        """자격증 준비 가능성을 계산합니다.

        Args:
            cert: 자격증 객체.
            request: 사용자 추천 요청.

        Returns:
            Feasibility 객체.
        """
        # Get study period (default to 90 days if not available)
        study_days = cert.study_period_days or 90

        # Calculate available days based on timeline
        available_days = AVAILABLE_DAYS.get(request.study_timeline, 365)

        # User can prepare if study_days <= available_days
        can_prepare = study_days <= available_days

        return Feasibility(
            can_prepare=can_prepare,
            estimated_days=study_days,
        )

    def _build_quick_stats(self, cert: Certificate) -> QuickStats:
        """MariaDB 데이터에서 QuickStats를 생성합니다.

        Args:
            cert: 자격증 객체.

        Returns:
            QuickStats 객체.
        """
        # 합격률
        passing_rate = cert.passing_rate

        # 평균 연봉 (career_info에서)
        career_info = cert.career_info or {}
        average_salary = career_info.get("average_salary")

        # 응시료 (exam_info에서)
        exam_info = cert.exam_info or {}
        exam_fee = exam_info.get("total_fee")

        # 시험 유형 (exam_info에서)
        exam_type = exam_info.get("exam_type")

        return QuickStats(
            passing_rate=passing_rate,
            average_salary=average_salary,
            exam_fee=exam_fee,
            exam_type=exam_type,
        )

    def _build_study_insights(self, cert: Certificate) -> StudyInsights:
        """MariaDB 데이터에서 StudyInsights를 생성합니다.

        Args:
            cert: 자격증 객체.

        Returns:
            StudyInsights 객체.
        """
        # 학습 팁 (user_reviews에서, 최대 3개)
        user_reviews = cert.user_reviews or {}
        study_tips = user_reviews.get("study_tips", [])[:3]

        # 합격 팁 (study_guide에서, 최대 2개)
        study_guide = cert.study_guide or {}
        success_tips = study_guide.get("success_tips", [])[:2]

        # 난이도 피드백 (user_reviews에서)
        difficulty_feedback = user_reviews.get("difficulty_feedback")

        return StudyInsights(
            study_tips=study_tips,
            success_tips=success_tips,
            difficulty_feedback=difficulty_feedback,
        )

    def _generate_query_summary(self, request: RecommendationRequest) -> str:
        """사용자 질의 요약을 생성합니다.

        Args:
            request: 사용자 추천 요청.

        Returns:
            질의 요약 문자열.
        """
        domains = ", ".join(request.interest_domains)
        parts = [
            f"{request.purpose} 목적",
            f"관심 분야: {domains}",
            f"준비 기간: {request.study_timeline}",
            f"난이도 선호: {request.difficulty_preference}",
        ]

        return " | ".join(parts)

    # ===== RAG-Specific Methods =====

    def _build_query_text(self, request: RecommendationRequest) -> str:
        """사용자 요청을 벡터 검색용 쿼리 텍스트로 변환합니다.

        자연어 문장으로 구성하여 더 정확한 의미 임베딩을 생성합니다.
        user_summary가 있으면 가장 높은 가중치를 부여합니다 (3중 강조).

        Args:
            request: 사용자 추천 요청.

        Returns:
            임베딩 생성용 쿼리 텍스트.
        """
        domain_text = ", ".join(request.interest_domains)
        timeline = request.study_timeline
        difficulty = request.difficulty_preference
        user_summary = (request.user_summary or "").strip()

        # user_summary가 있으면 3중 강조로 임베딩 가중치 극대화
        if user_summary:
            return (
                f"[최우선 요청] {user_summary}\n\n"
                f"배경: {request.purpose}, {domain_text} 분야, "
                f"기간 {timeline}, 난이도 {difficulty}\n\n"
                f"[핵심 키워드] {user_summary}\n\n"
                f"[사용자 요청] {user_summary}"
            )

        # user_summary가 없으면 기존 로직 (구조화된 쿼리)
        intent_sentence = (
            f"{request.purpose} 목적의 사용자가 {domain_text} 분야와 연관된 자격증을 찾고 있습니다. "
            "career_info의 industry/use_cases/related_jobs가 유사한 자격증을 우선 고려해주세요."
        )
        constraint_sentence = (
            f"예상 공부 기간은 {timeline}이며, 선호 난이도는 {difficulty}입니다."
        )

        return f"{intent_sentence}\n\n{constraint_sentence}"

    def _calculate_user_summary_bonus(
        self, cert: Certificate, user_summary: str | None
    ) -> int:
        """user_summary 키워드와 자격증 데이터 매칭 보너스를 계산합니다.

        사용자가 입력한 요청 문장의 키워드가 자격증 제목, 관련 직업,
        활용 분야에 포함되어 있으면 보너스 점수를 부여합니다.

        Args:
            cert: 자격증 객체.
            user_summary: 사용자가 입력한 원본 요청 문장.

        Returns:
            보너스 점수 (0-10).
        """
        if not user_summary:
            return 0

        bonus = 0
        # 2글자 이상인 키워드만 추출 (불용어 제거)
        keywords = {w.lower() for w in user_summary.split() if len(w) > 1}

        if not keywords:
            return 0

        # 제목 매칭: +5점
        title = cert.title.lower()
        if any(kw in title for kw in keywords):
            bonus += 5

        # 관련 직업/활용 분야 매칭: +3점씩
        career_info = cert.career_info or {}
        related_jobs = career_info.get("related_jobs", [])
        use_cases = career_info.get("use_cases", [])

        jobs_text = " ".join(related_jobs).lower()
        cases_text = " ".join(use_cases).lower()

        if any(kw in jobs_text for kw in keywords):
            bonus += 3

        if any(kw in cases_text for kw in keywords):
            bonus += 3

        return min(bonus, 10)  # 최대 10점

    def _build_vector_filter(self, request: RecommendationRequest) -> Optional[dict]:
        """벡터 검색용 ChromaDB where 필터를 생성합니다.

        B6 수정: 메타데이터 필터를 활용하여 벡터 검색 성능 향상.
        """
        constraints = self._build_constraints(request)
        filters = []

        # 난이도 필터
        max_difficulty = constraints.get("max_difficulty")
        if max_difficulty is not None:
            filters.append({"difficulty": {"$lte": max_difficulty}})

        # 학습 기간 필터
        max_study_days = constraints.get("max_study_days")
        if max_study_days is not None:
            filters.append({"study_period_days": {"$lte": max_study_days}})

        if not filters:
            return None

        if len(filters) == 1:
            return filters[0]

        return {"$and": filters}

    def _fetch_certificates_by_ids(
        self, cert_ids: list[str]
    ) -> list[dict[str, Any]]:
        """ID 리스트로 자격증 전체 데이터를 조회합니다.

        SQLAlchemy를 사용하여 MariaDB에서 동기적으로 조회합니다.
        (B1 수정: async → sync 변환하여 이벤트 루프 블로킹 방지)

        Args:
            cert_ids: 조회할 자격증 ID 리스트.

        Returns:
            자격증 딕셔너리 목록.
        """
        if not cert_ids:
            return []

        results = (
            self.db.query(CertificateModel)
            .filter(CertificateModel.id.in_(cert_ids))
            .all()
        )

        return [cert.to_dict() for cert in results]

    def _generate_recommendations_from_vector_results(
        self,
        similar_results: list[dict],
        certificates: list[dict[str, Any]],
        request: RecommendationRequest,
        constraints: Optional[dict[str, Any]] = None,
    ) -> list[RecommendedCertificate]:
        """벡터 검색 결과를 RecommendedCertificate 객체로 변환합니다.

        Args:
            similar_results: ChromaDB 벡터 검색 결과.
            certificates: MariaDB에서 조회한 전체 자격증 데이터.
            request: 사용자 추천 요청.
            constraints: 하드 필터 정보.

        Returns:
            RecommendedCertificate 객체 목록.
        """
        # Create cert ID to full data mapping
        cert_map = {cert["id"]: cert for cert in certificates}

        # Create cert ID to similarity score mapping
        score_map = {result["id"]: result["score"] for result in similar_results}

        recommendations = []

        for cert_id in cert_map:
            cert_data = cert_map[cert_id]
            similarity_score = score_map.get(cert_id, 0.0)

            # Parse certificate early for constraint checks
            cert = Certificate(**cert_data)

            # Convert similarity score (0.0-1.0) to match_score (0-100)
            match_score = int(similarity_score * 100)

            if constraints:
                max_diff = constraints.get("max_difficulty")
                max_days = constraints.get("max_study_days")
                if max_diff is not None and cert.difficulty and cert.difficulty <= max_diff:
                    match_score = min(100, match_score + 5)
                if max_days is not None and cert.study_period_days and cert.study_period_days <= max_days:
                    match_score = min(100, match_score + 5)

            # user_summary 키워드 매칭 보너스 적용
            user_bonus = self._calculate_user_summary_bonus(cert, request.user_summary)
            match_score = min(100, match_score + user_bonus)

            # Generate recommendation reason
            reason = self._generate_reason(cert, request)

            # Generate key points
            key_points = self._generate_key_points(cert, request)

            # Calculate feasibility
            feasibility = self._calculate_feasibility(cert, request)

            # Build quick stats and study insights
            quick_stats = self._build_quick_stats(cert)
            study_insights = self._build_study_insights(cert)

            # Get primary category name from categories array
            primary_category = cert.categories[0].name if cert.categories else "기타"

            recommendations.append(
                RecommendedCertificate(
                    certificate=cert,
                    qualification_category=primary_category,
                    match_score=match_score,
                    recommendation_reason=reason,
                    key_points=key_points,
                    feasibility=feasibility,
                    quick_stats=quick_stats,
                    study_insights=study_insights,
                )
            )

        # Sort by match_score descending
        recommendations.sort(key=lambda x: x.match_score, reverse=True)

        return recommendations
