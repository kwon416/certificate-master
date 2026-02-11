"""하이브리드 검색 (키워드 매칭 + 벡터 검색).

벡터 검색의 의미 기반 매칭과 키워드 검색의 정확한 매칭을 결합하여
더 나은 검색 결과를 제공합니다.

전략:
1. 벡터 검색: 의미적 유사도 (임베딩)
2. 키워드 매칭: 정확한 단어 일치 (TF-IDF 스타일)
3. Reciprocal Rank Fusion: 두 결과를 결합
"""
from typing import Dict, List
import re
from collections import Counter


def tokenize_korean(text: str) -> List[str]:
    """한글 텍스트를 토큰화합니다.

    간단한 공백 기반 토큰화를 사용합니다.

    Args:
        text: 토큰화할 텍스트

    Returns:
        토큰 리스트
    """
    # 소문자 변환
    text = text.lower()

    # 특수문자 제거 (한글, 영문, 숫자만 유지)
    text = re.sub(r"[^\w\s가-힣]", " ", text)

    # 공백으로 분리
    tokens = text.split()

    return [t for t in tokens if len(t) > 1]  # 1글자 토큰 제거


def calculate_keyword_score(query: str, text: str) -> float:
    """키워드 매칭 점수를 계산합니다 (TF-IDF 스타일).

    Args:
        query: 검색 쿼리
        text: 자격증 텍스트 (제목 + 개요)

    Returns:
        키워드 매칭 점수 (0.0-1.0)
    """
    query_tokens = tokenize_korean(query)
    text_tokens = tokenize_korean(text)

    if not query_tokens or not text_tokens:
        return 0.0

    # 쿼리 토큰 빈도
    query_counter = Counter(query_tokens)

    # 텍스트 토큰 빈도
    text_counter = Counter(text_tokens)

    # 매칭된 토큰 수 계산 (가중치 적용)
    matched_score = 0.0
    for token, query_freq in query_counter.items():
        if token in text_counter:
            # TF 스타일: 빈도에 따라 가중치
            text_freq = text_counter[token]
            matched_score += min(query_freq, text_freq)

    # 정규화: 0.0-1.0 범위로
    max_possible = sum(query_counter.values())
    if max_possible == 0:
        return 0.0

    score = matched_score / max_possible

    return min(1.0, score)


def reciprocal_rank_fusion(
    vector_scores: Dict[str, float],
    keyword_scores: Dict[str, float],
    k: int = 60,
) -> Dict[str, float]:
    """Reciprocal Rank Fusion으로 점수를 결합합니다.

    RRF 공식: RRF(d) = Σ 1/(k + rank(d))

    Args:
        vector_scores: 벡터 검색 점수 {id: score}
        keyword_scores: 키워드 검색 점수 {id: score}
        k: RRF 상수 (기본값: 60)

    Returns:
        결합된 점수 {id: combined_score}
    """
    # 벡터 검색 순위
    vector_ranked = sorted(vector_scores.items(), key=lambda x: x[1], reverse=True)
    vector_ranks = {cert_id: rank for rank, (cert_id, _) in enumerate(vector_ranked, 1)}

    # 키워드 검색 순위
    keyword_ranked = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)
    keyword_ranks = {cert_id: rank for rank, (cert_id, _) in enumerate(keyword_ranked, 1)}

    # 모든 ID 수집
    all_ids = set(vector_scores.keys()) | set(keyword_scores.keys())

    # RRF 점수 계산
    rrf_scores = {}
    for cert_id in all_ids:
        rrf_score = 0.0

        # 벡터 검색 기여도
        if cert_id in vector_ranks:
            rrf_score += 1.0 / (k + vector_ranks[cert_id])

        # 키워드 검색 기여도
        if cert_id in keyword_ranks:
            rrf_score += 1.0 / (k + keyword_ranks[cert_id])

        rrf_scores[cert_id] = rrf_score

    return rrf_scores


class HybridSearcher:
    """하이브리드 검색기 (키워드 + 벡터)."""

    def __init__(self, keyword_weight: float = 0.3, vector_weight: float = 0.7):
        """초기화.

        Args:
            keyword_weight: 키워드 검색 가중치 (0.0-1.0)
            vector_weight: 벡터 검색 가중치 (0.0-1.0)
        """
        self.keyword_weight = keyword_weight
        self.vector_weight = vector_weight

    def calculate_keyword_scores(
        self, query: str, certificates: List[dict]
    ) -> Dict[str, float]:
        """모든 자격증에 대한 키워드 점수 계산.

        Args:
            query: 검색 쿼리
            certificates: 자격증 리스트

        Returns:
            {cert_id: keyword_score}
        """
        keyword_scores = {}

        for cert in certificates:
            cert_id = str(cert.get("id", ""))
            title = cert.get("title", "")
            overview = cert.get("overview", "")

            # 제목과 개요 결합
            text = f"{title} {overview}"

            # 키워드 점수 계산
            score = calculate_keyword_score(query, text)
            keyword_scores[cert_id] = score

        return keyword_scores

    def hybrid_search(
        self,
        query: str,
        certificates: List[dict],
        vector_scores: Dict[str, float],
    ) -> List[dict]:
        """하이브리드 검색 수행.

        Args:
            query: 검색 쿼리
            certificates: 자격증 리스트
            vector_scores: 벡터 검색 점수 {cert_id: score}

        Returns:
            정렬된 자격증 리스트
        """
        # 1. 키워드 점수 계산
        keyword_scores = self.calculate_keyword_scores(query, certificates)

        # 2. RRF로 점수 결합
        combined_scores = reciprocal_rank_fusion(vector_scores, keyword_scores)

        # 3. 자격증 ID 매핑
        cert_dict = {str(cert.get("id", "")): cert for cert in certificates}

        # 4. 정렬
        sorted_ids = sorted(
            combined_scores.keys(),
            key=lambda x: combined_scores[x],
            reverse=True,
        )

        # 5. 결과 생성
        results = []
        for cert_id in sorted_ids:
            if cert_id in cert_dict:
                cert = cert_dict[cert_id].copy()
                cert["hybrid_score"] = combined_scores[cert_id]
                cert["keyword_score"] = keyword_scores.get(cert_id, 0.0)
                cert["vector_score"] = vector_scores.get(cert_id, 0.0)
                results.append(cert)

        return results

    def hybrid_search_weighted(
        self,
        query: str,
        certificates: List[dict],
        vector_scores: Dict[str, float],
    ) -> List[dict]:
        """가중치 기반 하이브리드 검색.

        RRF 대신 가중치 평균을 사용합니다.

        Args:
            query: 검색 쿼리
            certificates: 자격증 리스트
            vector_scores: 벡터 검색 점수 {cert_id: score}

        Returns:
            정렬된 자격증 리스트
        """
        # 키워드 점수 계산
        keyword_scores = self.calculate_keyword_scores(query, certificates)

        # 가중치 평균
        combined_scores = {}
        all_ids = set(vector_scores.keys()) | set(keyword_scores.keys())

        for cert_id in all_ids:
            vector_score = vector_scores.get(cert_id, 0.0)
            keyword_score = keyword_scores.get(cert_id, 0.0)

            combined = (
                self.vector_weight * vector_score + self.keyword_weight * keyword_score
            )
            combined_scores[cert_id] = combined

        # 자격증 ID 매핑
        cert_dict = {str(cert.get("id", "")): cert for cert in certificates}

        # 정렬
        sorted_ids = sorted(
            combined_scores.keys(),
            key=lambda x: combined_scores[x],
            reverse=True,
        )

        # 결과 생성
        results = []
        for cert_id in sorted_ids:
            if cert_id in cert_dict:
                cert = cert_dict[cert_id].copy()
                cert["hybrid_score"] = combined_scores[cert_id]
                cert["keyword_score"] = keyword_scores.get(cert_id, 0.0)
                cert["vector_score"] = vector_scores.get(cert_id, 0.0)
                results.append(cert)

        return results
