"""적응형 유사도 임계값 계산.

검색 결과의 품질에 따라 임계값을 동적으로 조정합니다.
"""
from typing import List

from app.core.config import get_settings

_settings = get_settings()

# 기본 임계값
DEFAULT_THRESHOLD = _settings.RECOMMENDATION_MIN_SIMILARITY_SCORE  # 0.3
ABSOLUTE_MIN_THRESHOLD = 0.2  # 절대 최소 임계값
MAX_THRESHOLD = 0.5  # 최대 임계값 (너무 엄격하지 않게)


def calculate_adaptive_threshold(scores: List[float]) -> float:
    """검색 결과의 품질에 따라 적응형 임계값을 계산합니다.

    전략:
    1. 높은 품질 (최고 점수 >= 0.6): 임계값 상향 조정 (더 엄격)
    2. 중간 품질 (0.4 <= 최고 점수 < 0.6): 기본 임계값 유지
    3. 낮은 품질 (최고 점수 < 0.4): 임계값 하향 조정 (더 관대)

    Args:
        scores: 유사도 점수 리스트 (내림차순 정렬 권장)

    Returns:
        float: 적응형 임계값 (ABSOLUTE_MIN_THRESHOLD ~ MAX_THRESHOLD 범위)
    """
    if not scores:
        return DEFAULT_THRESHOLD

    max_score = max(scores)

    # 1. 높은 품질: 임계값 상향
    if max_score >= 0.6:
        # 최고 점수가 높을수록 임계값도 높임
        # 0.6 → 0.40, 0.7 → 0.45, 0.8+ → 0.50
        threshold = DEFAULT_THRESHOLD + (max_score - 0.6) * 0.5
        threshold = min(threshold, MAX_THRESHOLD)  # 최대값 제한

    # 2. 낮은 품질: 임계값 하향
    elif max_score < 0.4:
        # 최고 점수가 낮을수록 임계값도 낮춤
        # 0.35 → 0.25, 0.30 → 0.20 (절대 최소값)
        threshold = max_score - 0.10
        threshold = max(threshold, ABSOLUTE_MIN_THRESHOLD)  # 최소값 제한

    # 3. 중간 품질: 기본 임계값 유지
    else:
        threshold = DEFAULT_THRESHOLD

    return round(threshold, 2)


def filter_by_adaptive_threshold(
    results: List[dict], score_key: str = "score"
) -> List[dict]:
    """적응형 임계값을 사용하여 결과를 필터링합니다.

    Args:
        results: 검색 결과 리스트 (각 항목은 score_key를 포함)
        score_key: 점수가 저장된 키 이름

    Returns:
        List[dict]: 필터링된 결과 리스트
    """
    if not results:
        return []

    scores = [r.get(score_key, 0.0) for r in results]
    threshold = calculate_adaptive_threshold(scores)

    filtered = [r for r in results if r.get(score_key, 0.0) >= threshold]

    return filtered
