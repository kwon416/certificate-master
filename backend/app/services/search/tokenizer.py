"""공백 분할 + character 2-gram 토큰화.

한국어 자격증명은 대부분 명사 조합이므로 형태소 분석 없이
공백 분할 + 2-gram 방식으로 충분한 키워드 매칭이 가능하다.
"""


def tokenize(text: str) -> list[str]:
    """텍스트를 공백 분할 후 2-gram을 포함한 토큰 리스트로 변환한다.

    Args:
        text: 토큰화할 텍스트

    Returns:
        중복 제거된 토큰 리스트 (원본 단어 + 2-gram)
    """
    text = text.strip()
    if not text:
        return []

    words = text.split()
    seen: set[str] = set()
    tokens: list[str] = []

    for word in words:
        if word and word not in seen:
            seen.add(word)
            tokens.append(word)

        if len(word) >= 2:
            for i in range(len(word) - 1):
                bigram = word[i : i + 2]
                if bigram not in seen:
                    seen.add(bigram)
                    tokens.append(bigram)

    return tokens
