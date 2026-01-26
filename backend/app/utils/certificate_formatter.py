"""자격증 데이터 포맷팅 유틸리티.

B4: format 함수 중복 제거 - EmbeddingService와 VectorStoreService에서 공통 사용.
"""


def format_certificate_text(cert: dict) -> str:
    """임베딩 생성을 위해 자격증 데이터를 텍스트로 포맷합니다.

    의미 임베딩 생성을 위해 관련 필드를 하나의 텍스트로 결합합니다.
    섹션별로 구분하여 검색 품질을 높입니다.

    Args:
        cert: 자격증 데이터를 담은 딕셔너리.

    Returns:
        임베딩용으로 포맷된 텍스트 문자열.
    """
    # categories 배열에서 이름 추출
    categories = cert.get('categories', [])
    category_display = ", ".join([cat.get('name', '') for cat in categories]) if categories else ""

    parts = [
        f"자격증: {cert.get('title', '')}",
        f"분류: {category_display}",
        f"계열: {cert.get('series', '')}",
        f"개요: {cert.get('overview', '')}",
        f"난이도: {cert.get('difficulty', 'N/A')}/5",
        f"준비기간: {cert.get('study_period_days', 'N/A')}일",
    ]

    # Career info (진로 정보)
    career = cert.get("career_info", {}) or {}
    career_parts = []
    if career.get("industry"):
        industry = career["industry"]
        if isinstance(industry, list):
            career_parts.append(f"산업분야: {', '.join(industry)}")
        else:
            career_parts.append(f"산업분야: {industry}")
    if career.get("use_cases"):
        career_parts.append(f"활용분야: {', '.join(career['use_cases'])}")
    if career.get("related_jobs"):
        career_parts.append(f"관련직업: {', '.join(career['related_jobs'])}")
    if career.get("job_prospects"):
        career_parts.append(f"취업전망: {career['job_prospects']}")
    if career.get("average_salary"):
        career_parts.append(f"평균연봉: {career['average_salary']}")

    if career_parts:
        parts.append("")
        parts.append("[진로 정보]")
        parts.extend(career_parts)

    # Exam info (시험 정보)
    exam = cert.get("exam_info", {}) or {}
    exam_parts = []
    if exam.get("exam_type"):
        exam_parts.append(f"시험유형: {exam['exam_type']}")
    if exam.get("exam_structure"):
        exam_parts.append(f"시험구성: {exam['exam_structure']}")
    if exam.get("subjects"):
        exam_parts.append(f"시험과목: {', '.join(exam['subjects'])}")
    if exam.get("passing_criteria"):
        exam_parts.append(f"합격기준: {exam['passing_criteria']}")
    if exam.get("pass_rate_trend"):
        exam_parts.append(f"합격률추이: {exam['pass_rate_trend']}")
    if exam.get("recent_trends"):
        exam_parts.append(f"최근출제동향: {exam['recent_trends']}")

    if exam_parts:
        parts.append("")
        parts.append("[시험 정보]")
        parts.extend(exam_parts)

    # User reviews (학습자 후기)
    reviews = cert.get("user_reviews", {}) or {}
    review_parts = []
    if reviews.get("difficulty_feedback"):
        review_parts.append(f"난이도피드백: {reviews['difficulty_feedback']}")
    if reviews.get("summary"):
        review_parts.append(f"후기요약: {reviews['summary']}")
    if reviews.get("study_tips"):
        tips = reviews["study_tips"][:2]  # 상위 2개
        review_parts.append(f"학습팁: {' / '.join(tips)}")

    if review_parts:
        parts.append("")
        parts.append("[학습자 후기]")
        parts.extend(review_parts)

    # Study guide (학습 가이드)
    guide = cert.get("study_guide", {}) or {}
    guide_parts = []
    if guide.get("study_methods"):
        methods = guide["study_methods"][:2]  # 상위 2개
        guide_parts.append(f"학습방법: {' / '.join(methods)}")
    if guide.get("success_tips"):
        tips = guide["success_tips"][:3]  # 상위 3개
        guide_parts.append(f"성공팁: {' / '.join(tips)}")

    if guide_parts:
        parts.append("")
        parts.append("[학습 가이드]")
        parts.extend(guide_parts)

    return "\n".join(parts)


def build_certificate_metadata(cert: dict) -> dict:
    """ChromaDB 저장용 메타데이터를 빌드합니다.

    Args:
        cert: 자격증 데이터를 담은 딕셔너리.

    Returns:
        메타데이터 딕셔너리.
    """
    career = cert.get("career_info", {}) or {}
    exam = cert.get("exam_info", {}) or {}

    # industry 처리
    industry = career.get("industry", [])
    if isinstance(industry, list):
        industry_str = ", ".join(industry)
    else:
        industry_str = industry or ""

    # categories 배열에서 이름 추출
    categories = cert.get("categories", [])
    categories_str = ", ".join([cat.get("name", "") for cat in categories]) if categories else ""

    return {
        "title": cert.get("title", ""),
        "categories": categories_str,
        "series": cert.get("series", "") or "",
        "difficulty": cert.get("difficulty"),
        "study_period_days": cert.get("study_period_days"),
        "overview": (cert.get("overview", "") or "")[:500],
        "industry": industry_str[:200],
        "average_salary": (career.get("average_salary", "") or "")[:100],
        "exam_type": (exam.get("exam_type", "") or "")[:100],
    }
