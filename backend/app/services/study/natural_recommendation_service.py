"""자연어 기반 자격증 추천 통합 서비스.

3단계 파이프라인:
1. LLM 상황 구조화 + 쿼리 생성 (통합)
2. 도메인 필터 + 벡터 검색 + 소프트 필터
3. LLM 추천 이유 생성
"""

import logging
from typing import Any, List, Optional

from sqlalchemy.orm import Session

from app.models.certificate import Certificate as CertificateModel
from app.schemas.certificate import Certificate
from app.schemas.recommendation import (
    NaturalLanguageRequest,
    NaturalLanguageResponse,
    RecommendedCertificate,
    StructuredUserContext,
    UnifiedRecommendationRequest,
    UnifiedRecommendationResponse,
    Feasibility,
    QuickStats,
    StudyInsights,
)
from app.services.embedding.vector_store import VectorStoreService
from app.services.llm.context_extractor import ContextExtractorService
from app.services.study.reason_generator import ReasonGeneratorService

logger = logging.getLogger(__name__)

from app.core.config import get_settings

_settings = get_settings()
RECOMMENDATION_TOP_K = _settings.RECOMMENDATION_TOP_K
MIN_SIMILARITY_SCORE = _settings.RECOMMENDATION_MIN_SIMILARITY_SCORE


class NaturalRecommendationService:
    """자연어 기반 자격증 추천 통합 서비스.

    3단계 파이프라인:
    1. 상황 구조화 + 쿼리 생성 (ContextExtractorService)
    2. 도메인 필터 + 벡터 검색 + 소프트 필터
    3. 추천 이유 생성 (ReasonGeneratorService)
    """

    def __init__(
        self,
        db: Optional[Session],
        context_extractor: Optional[ContextExtractorService] = None,
        reason_generator: Optional[ReasonGeneratorService] = None,
        vector_store: Optional[VectorStoreService] = None,
    ):
        """서비스를 초기화합니다.

        Args:
            db: SQLAlchemy 데이터베이스 세션.
            context_extractor: 상황 구조화 서비스.
            reason_generator: 추천 이유 생성 서비스.
            vector_store: 벡터 스토어 서비스.
        """
        self.db = db
        self.context_extractor = context_extractor or ContextExtractorService()
        self.reason_generator = reason_generator or ReasonGeneratorService()
        self.vector_store = vector_store or VectorStoreService()

    async def get_recommendations(
        self, request: NaturalLanguageRequest
    ) -> NaturalLanguageResponse:
        """자연어 기반 자격증 추천을 생성합니다.

        Args:
            request: 자연어 추천 요청.

        Returns:
            NaturalLanguageResponse: 추천 결과.
        """
        logger.info(f"[Natural] Processing request: {request.user_input[:50]}...")

        # Step 1: 자연어 → 구조화
        logger.info("[Step 1] Extracting structured context...")
        structured_context = await self.context_extractor.extract_context(
            request.user_input
        )
        logger.info(f"[Step 1] Context: goal={structured_context.goal}, "
                   f"background={structured_context.major_background}")

        # Step 3: 벡터 검색 (자연어 입력을 쿼리로 사용)
        query = request.user_input
        logger.info(f"[Step 3] Query: {query[:50]}...")

        # 벡터 검색 실행
        raw_results = self.vector_store.search_records(
            namespace=VectorStoreService.NAMESPACE,
            query=query,
            top_k=RECOMMENDATION_TOP_K * 3,
        )
        logger.info(f"[Step 3] Found {len(raw_results)} raw candidates")

        # 고정 임계값 필터링
        similar_results = [r for r in raw_results if r.get("score", 0) >= MIN_SIMILARITY_SCORE]
        logger.info(f"[Step 3] After threshold: {len(similar_results)} candidates")

        if not similar_results:
            return NaturalLanguageResponse(
                structured_context=structured_context,
                recommendations=[],
                query_used=query,
                total_matched=0,
                follow_up_question="검색 결과가 없습니다. 좀 더 구체적인 정보를 알려주시면 도움이 될 것 같아요.",
            )

        # 자격증 상세 정보 조회
        cert_ids = [result["id"] for result in similar_results]
        certificates = self._fetch_certificates_by_ids(cert_ids)
        logger.info(f"[Step 3] Fetched {len(certificates)} certificates")

        # Step 2: 하드 필터링
        logger.info("[Step 2] Applying hard filters...")
        filtered_certificates = self._apply_hard_filters(certificates, structured_context)
        logger.info(f"[Step 2] After filtering: {len(filtered_certificates)} certificates")

        if not filtered_certificates:
            return NaturalLanguageResponse(
                structured_context=structured_context,
                recommendations=[],
                query_used=query,
                total_matched=0,
                follow_up_question="조건에 맞는 자격증을 찾지 못했습니다. 준비 기간이나 난이도 조건을 조정해보시겠어요?",
            )

        # 유사도 점수 매핑
        score_map = {result["id"]: result["score"] for result in similar_results}

        # Step 4: 점수 계산
        logger.info("[Step 4] Calculating scores...")
        scored_certificates = []

        for cert in filtered_certificates:
            similarity = score_map.get(cert["id"], 0.0)
            final_score = self._calculate_final_score(cert, similarity, structured_context)

            scored_certificates.append({
                **cert,
                "similarity": similarity,
                "final_score": final_score,
            })

        # 점수 기준 정렬 및 상위 N개 선택
        scored_certificates.sort(key=lambda x: x["final_score"], reverse=True)
        top_certificates = scored_certificates[:RECOMMENDATION_TOP_K]

        # Step 5: 추천 이유 생성
        logger.info("[Step 5] Generating recommendation reasons...")
        recommendations = await self._generate_recommendations(
            top_certificates, structured_context
        )
        logger.info(f"[Step 5] Generated {len(recommendations)} recommendations")

        return NaturalLanguageResponse(
            structured_context=structured_context,
            recommendations=recommendations,
            query_used=query,
            total_matched=len(filtered_certificates),
            follow_up_question=self._generate_follow_up_question(structured_context),
        )

    def _apply_hard_filters(
        self,
        certificates: list[dict[str, Any]],
        context: StructuredUserContext,
    ) -> list[dict[str, Any]]:
        """하드 필터링을 적용합니다.

        필터링 조건:
        1. 비전공자: self_study_possible == True
        2. 재직자: study_period_days <= max_study_period_days
        3. 주당 학습시간: weekly_hours_required <= weekly_study_hours * 1.5

        Args:
            certificates: 자격증 데이터 리스트.
            context: 구조화된 사용자 상황.

        Returns:
            필터링된 자격증 리스트.
        """
        filtered = []

        for cert in certificates:
            feasibility_info = cert.get("feasibility_info") or {}
            study_period_days = cert.get("study_period_days") or 90

            # 필터 1: 비전공자 필터
            if context.major_background == "비전공자":
                self_study_possible = feasibility_info.get("self_study_possible")
                if self_study_possible is False:
                    continue

            # 필터 2: 재직자 필터 (시간 제약이 있음)
            if context.employment_status == "재직 중":
                if study_period_days > context.max_study_period_days:
                    continue

            # 필터 3: 주당 학습시간 필터
            weekly_hours_required = feasibility_info.get("weekly_hours_required")
            if weekly_hours_required is not None:
                max_allowed_hours = context.weekly_study_hours * 1.5
                if weekly_hours_required > max_allowed_hours:
                    continue

            filtered.append(cert)

        return filtered

    def _calculate_final_score(
        self,
        cert: dict[str, Any],
        similarity: float,
        context: StructuredUserContext,
    ) -> int:
        """최종 점수를 계산합니다.

        점수 공식:
        - 유사도 50%
        - 채용 시장 20%
        - 비전공자 친화 15%
        - 직장인 친화 15%

        Args:
            cert: 자격증 데이터.
            similarity: 벡터 유사도 (0.0-1.0).
            context: 구조화된 사용자 상황.

        Returns:
            최종 점수 (0-100).
        """
        score = 0.0

        # 1. 유사도 (50%)
        score += similarity * 50

        # 2. 채용 시장 보너스 (20%)
        job_market_info = cert.get("job_market_info") or {}
        job_frequency = job_market_info.get("job_posting_frequency", "")
        if job_frequency in ["매우 많음", "많음"]:
            score += 20
        elif job_frequency == "보통":
            score += 10

        # 3. 비전공자 친화 보너스 (15%)
        feasibility_info = cert.get("feasibility_info") or {}
        if context.major_background == "비전공자":
            if feasibility_info.get("self_study_possible"):
                score += 15
            non_major_rate = feasibility_info.get("non_major_pass_rate", "")
            if non_major_rate and "30" in non_major_rate:
                score += 5  # 추가 보너스

        # 4. 직장인 친화 보너스 (15%)
        if context.employment_status == "재직 중":
            study_period = cert.get("study_period_days") or 90
            if study_period <= context.max_study_period_days * 0.7:
                score += 15  # 여유 있게 준비 가능
            elif study_period <= context.max_study_period_days:
                score += 10

        return min(100, int(score))

    def _fetch_certificates_by_ids(
        self, cert_ids: list[str]
    ) -> list[dict[str, Any]]:
        """ID로 자격증 상세 정보를 조회합니다.

        Args:
            cert_ids: 자격증 ID 리스트.

        Returns:
            자격증 데이터 딕셔너리 리스트.
        """
        if not cert_ids or not self.db:
            return []

        results = (
            self.db.query(CertificateModel)
            .filter(CertificateModel.id.in_(cert_ids))
            .all()
        )

        return [cert.to_dict() for cert in results]

    async def _generate_recommendations(
        self,
        certificates: list[dict[str, Any]],
        context: StructuredUserContext,
    ) -> list[RecommendedCertificate]:
        """추천 결과를 생성합니다.

        Args:
            certificates: 점수가 계산된 자격증 리스트.
            context: 구조화된 사용자 상황.

        Returns:
            RecommendedCertificate 리스트.
        """
        recommendations = []

        # 추천 이유 일괄 생성
        cert_infos = [
            {
                "title": cert.get("title"),
                "overview": cert.get("overview"),
                "career_info": cert.get("career_info"),
                "feasibility_info": cert.get("feasibility_info"),
            }
            for cert in certificates
        ]
        reasons = await self.reason_generator.generate_reasons_batch(context, cert_infos)

        for cert, reason in zip(certificates, reasons):
            # Certificate 스키마 변환
            cert_schema = Certificate(**cert)

            # Feasibility 계산
            study_days = cert.get("study_period_days") or 90
            can_prepare = study_days <= context.max_study_period_days
            feasibility = Feasibility(
                can_prepare=can_prepare,
                estimated_days=study_days,
            )

            # QuickStats 생성
            career_info = cert.get("career_info") or {}
            exam_info = cert.get("exam_info") or {}
            quick_stats = QuickStats(
                passing_rate=cert.get("passing_rate"),
                average_salary=career_info.get("average_salary"),
                exam_fee=exam_info.get("total_fee"),
                exam_type=exam_info.get("exam_type"),
            )

            # StudyInsights 생성
            user_reviews = cert.get("user_reviews") or {}
            study_guide = cert.get("study_guide") or {}
            study_insights = StudyInsights(
                study_tips=user_reviews.get("study_tips", [])[:3],
                success_tips=study_guide.get("success_tips", [])[:2],
                difficulty_feedback=user_reviews.get("difficulty_feedback"),
            )

            # 핵심 포인트 생성
            key_points = self._generate_key_points(cert, context)

            # 주 카테고리
            primary_category = (
                cert_schema.categories[0].name if cert_schema.categories else "기타"
            )

            recommendations.append(
                RecommendedCertificate(
                    certificate=cert_schema,
                    qualification_category=primary_category,
                    match_score=cert.get("final_score", 50),
                    recommendation_reason=reason,
                    key_points=key_points,
                    feasibility=feasibility,
                    quick_stats=quick_stats,
                    study_insights=study_insights,
                )
            )

        return recommendations

    def _generate_key_points(
        self, cert: dict[str, Any], context: StructuredUserContext
    ) -> list[str]:
        """핵심 포인트를 생성합니다.

        Args:
            cert: 자격증 데이터.
            context: 구조화된 사용자 상황.

        Returns:
            핵심 포인트 리스트.
        """
        points = []

        # 난이도
        difficulty = cert.get("difficulty")
        if difficulty:
            labels = {
                1: "초급 난이도 (입문자 적합)",
                2: "중하 난이도 (기초 지식 필요)",
                3: "중급 난이도 (체계적 학습 필요)",
                4: "중상 난이도 (전문 학습 필요)",
                5: "고급 난이도 (장기 준비 필요)",
            }
            points.append(labels.get(difficulty, ""))

        # 준비 기간
        study_days = cert.get("study_period_days")
        if study_days:
            months = max(1, study_days // 30)
            points.append(f"약 {months}개월 준비 기간")

        # 관련 직업
        career_info = cert.get("career_info") or {}
        related_jobs = career_info.get("related_jobs", [])[:2]
        if related_jobs:
            points.append(f"관련 직업: {', '.join(related_jobs)}")

        # 채용 시장
        job_market = cert.get("job_market_info") or {}
        frequency = job_market.get("job_posting_frequency")
        if frequency in ["매우 많음", "많음"]:
            points.append("채용 시장에서 높은 수요")

        # 비전공자 친화
        feasibility = cert.get("feasibility_info") or {}
        if context.major_background == "비전공자" and feasibility.get("self_study_possible"):
            points.append("비전공자 독학 가능")

        return points[:5]

    def _calculate_score(
        self,
        similarity: float,
        cert: dict,
        context: StructuredUserContext,
    ) -> int:
        """새로운 점수 계산 공식.

        도메인 필터가 사전 적용되므로 유사도 비중 70%.

        Args:
            similarity: 벡터 유사도 (0.0-1.0).
            cert: 자격증 데이터.
            context: 구조화된 사용자 상황.

        Returns:
            최종 점수 (0-100).
        """
        score = similarity * 70  # 벡터 유사도 70%

        # 비전공자 보너스/감점
        feasibility_info = cert.get("feasibility_info") or {}
        if context.major_background == "비전공자":
            self_study = feasibility_info.get("self_study_possible")
            if self_study is True:
                score += 10
            elif self_study is False:
                score -= 15
            # None이면 중립 (0점)

        # 재직자 보너스
        if context.employment_status == "재직 중":
            study_period = cert.get("study_period_days") or 90
            if study_period <= context.max_study_period_days * 0.7:
                score += 10
            elif study_period <= context.max_study_period_days:
                score += 5

        # 채용 시장 보너스
        job_market = cert.get("job_market_info") or {}
        frequency = job_market.get("job_posting_frequency", "")
        if frequency in ["매우 많음", "많음"]:
            score += 10

        return min(100, max(0, int(score)))

    async def get_unified_recommendations(
        self, request: UnifiedRecommendationRequest
    ) -> UnifiedRecommendationResponse:
        """통합 추천 (분야 선택 + 자연어).

        3단계 파이프라인:
        1. 상황 구조화 + 쿼리 생성 (LLM 1회)
        2. 도메인 필터 + 벡터 검색
        3. 추천 이유 생성 (LLM 1회)
        """
        logger.info(f"[Unified] Processing: domains={request.domains}, input={request.user_input[:50]}...")

        # Step 1: 상황 구조화 + 쿼리 생성
        context, query = await self.context_extractor.extract_context_and_query(
            user_input=request.user_input,
            selected_domains=request.domains,
        )
        logger.info(f"[Step 1] Context: goal={context.goal}, query={query[:50]}")

        # Step 2: 도메인 필터 + 벡터 검색
        filter_dict = None
        if len(request.domains) == 1:
            filter_dict = {"domain": {"$contains": request.domains[0]}}
        elif len(request.domains) > 1:
            filter_dict = {"$or": [{"domain": {"$contains": d}} for d in request.domains]}

        raw_results = self.vector_store.search_records(
            namespace=VectorStoreService.NAMESPACE,
            query=query,
            top_k=RECOMMENDATION_TOP_K * 2,
            filter_dict=filter_dict,
        )
        logger.info(f"[Step 2] Found {len(raw_results)} candidates with domain filter")

        # 고정 임계값 필터링
        MIN_SCORE = 0.25
        similar_results = [r for r in raw_results if r.get("score", 0) >= MIN_SCORE]
        logger.info(f"[Step 2] After threshold: {len(similar_results)} candidates")

        if not similar_results:
            return UnifiedRecommendationResponse(
                structured_context=context,
                recommendations=[],
                query_used=query,
                total_matched=0,
            )

        # 자격증 상세 정보 조회
        cert_ids = [result["id"] for result in similar_results]
        certificates = self._fetch_certificates_by_ids(cert_ids)

        # 유사도 점수 매핑
        score_map = {result["id"]: result["score"] for result in similar_results}

        # 소프트 필터 + 점수 계산
        scored_certificates = []
        for cert in certificates:
            similarity = score_map.get(cert["id"], 0.0)
            final_score = self._calculate_score(similarity, cert, context)
            scored_certificates.append({
                **cert,
                "similarity": similarity,
                "final_score": final_score,
            })

        # 점수 기준 정렬 및 상위 N개 선택
        scored_certificates.sort(key=lambda x: x["final_score"], reverse=True)
        top_certificates = scored_certificates[:RECOMMENDATION_TOP_K]

        # Step 3: 추천 이유 생성
        recommendations = await self._generate_recommendations(
            top_certificates, context
        )

        return UnifiedRecommendationResponse(
            structured_context=context,
            recommendations=recommendations,
            query_used=query,
            total_matched=len(similar_results),
        )

    def _generate_follow_up_question(
        self, context: StructuredUserContext
    ) -> Optional[str]:
        """후속 질문을 생성합니다.

        Args:
            context: 구조화된 사용자 상황.

        Returns:
            후속 질문 또는 None.
        """
        if not context.preferred_industries:
            return "어떤 산업 분야에 관심이 있으신가요? (IT, 금융, 건설 등)"

        if context.goal == "취업" and context.employment_status == "학생":
            return "목표하시는 구체적인 직종이 있으신가요?"

        return None
