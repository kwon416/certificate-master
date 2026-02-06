"""중앙 집중화된 상수 정의.

프롬프트와 스키마에서 사용하는 Enum 값들을 한 곳에서 관리합니다.
"""


class RecommendationConstants:
    """자연어 추천 시스템에서 사용하는 상수들."""

    # 자격증 취득 목표
    NATURAL_GOALS = [
        "취업",
        "이직",
        "전문성 강화",
        "개인 관심",
        "창업",
    ]

    # 현재 고용 상태
    EMPLOYMENT_STATUS = [
        "재직 중",
        "구직 중",
        "학생",
        "무직",
    ]

    # 전공/경력 배경
    MAJOR_BACKGROUND = [
        "전공자",
        "비전공자",
        "관련 경험 있음",
    ]

    # 난이도 선호
    NATURAL_DIFFICULTY = [
        "상",
        "중상",
        "중",
        "중하",
        "하",
    ]

    @classmethod
    def format_for_prompt(cls, values: list[str], separator: str = " | ") -> str:
        """프롬프트용 문자열 포맷으로 변환.

        Args:
            values: 상수 리스트
            separator: 구분자 (기본값: ' | ')

        Returns:
            '"값1" | "값2" | "값3"' 형식의 문자열
        """
        return separator.join(f'"{v}"' for v in values)
