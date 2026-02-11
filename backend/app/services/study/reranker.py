"""도메인 기반 리랭킹 시스템.

벡터 검색 결과를 도메인 매칭, 키워드 분석으로 재정렬합니다.
"""
from typing import List, Dict

from app.models.certificate import Certificate


class DomainReranker:
    """도메인 기반 리랭커."""

    # IT 분야 부스팅 키워드 (제목에서 검색)
    IT_BOOST_KEYWORDS = [
        "정보처리",
        "소프트웨어",
        "프로그래밍",
        "코딩",
        "데이터",
        "시스템",
        "네트워크",
        "보안",
        "클라우드",
        "AI",
        "빅데이터",
        "컴퓨터",
        "웹",
        "앱",
        "Java",
        "Python",
    ]

    # 제외 키워드 (제목에 있으면 감점)
    EXCLUSION_KEYWORDS = [
        "건축",
        "철골",
        "용접",
        "CAD",
        "모델링",
        "제도",
        "기계",
        "금속",
        "조리",
        "미용",
        "관광",
        "수산",
        "농업",
        "전기설비",
        "전기공사",
        "전기기기",
        "공조냉동",
        "품질관리",
    ]

    # 도메인별 산업 키워드
    DOMAIN_INDUSTRY_KEYWORDS = {
        "IT개발": ["IT", "정보처리", "소프트웨어", "시스템", "네트워크"],
        "금융": ["금융", "회계", "세무", "재무", "은행"],
        "의료": ["의료", "간호", "보건", "임상", "약사"],
        "건설": ["건설", "건축", "토목", "측량"],
    }

    def calculate_final_score(
        self,
        certificate: Certificate,
        vector_similarity: float,
        user_domains: List[str],
    ) -> float:
        """최종 점수 계산.

        Args:
            certificate: 자격증 객체
            vector_similarity: 벡터 유사도 점수 (0~1)
            user_domains: 사용자가 관심있는 도메인 리스트

        Returns:
            최종 점수 (0~1)
        """
        score = vector_similarity

        # 1. 제목 키워드 부스팅 (IT 분야)
        if "IT개발" in user_domains:
            for keyword in self.IT_BOOST_KEYWORDS:
                if keyword in certificate.title:
                    score += 0.15  # 15% 부스팅
                    break

        # 2. 제목 제외 키워드 패널티
        for keyword in self.EXCLUSION_KEYWORDS:
            if keyword in certificate.title:
                score -= 0.20  # 20% 감점
                break

        # 3. 산업 분야 매칭 부스팅
        if certificate.career_info:
            cert_industries = certificate.career_info.get("industry", [])
            if isinstance(cert_industries, list):
                for domain in user_domains:
                    domain_keywords = self.DOMAIN_INDUSTRY_KEYWORDS.get(domain, [])
                    for keyword in domain_keywords:
                        if any(keyword in industry for industry in cert_industries):
                            score += 0.10  # 10% 부스팅
                            break

        # 최종 점수는 0~1 범위로 클리핑
        return max(0.0, min(1.0, score))

    def rerank(
        self,
        certificates: List[Certificate],
        vector_scores: Dict[int, float],
        user_domains: List[str],
    ) -> List[Certificate]:
        """자격증 리스트를 재정렬.

        Args:
            certificates: 자격증 리스트
            vector_scores: {certificate_id: vector_similarity_score}
            user_domains: 사용자 관심 도메인

        Returns:
            재정렬된 자격증 리스트 (점수 높은 순)
        """
        scored_certs = []

        for cert in certificates:
            vector_score = vector_scores.get(cert.id, 0.0)
            final_score = self.calculate_final_score(
                certificate=cert,
                vector_similarity=vector_score,
                user_domains=user_domains,
            )
            scored_certs.append((final_score, cert))

        # 점수 내림차순 정렬
        scored_certs.sort(key=lambda x: x[0], reverse=True)

        return [cert for _, cert in scored_certs]
