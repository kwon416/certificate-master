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

    # ============================================================
    # 취업준비생 관점 정보 (NEW: 2026-01-28)
    # ============================================================

    # Job market info (채용 시장 정보)
    job_market = cert.get("job_market_info", {}) or {}
    job_market_parts = []
    if job_market.get("job_posting_frequency"):
        job_market_parts.append(f"채용공고빈도: {job_market['job_posting_frequency']}")
    if job_market.get("preferred_industries"):
        job_market_parts.append(f"선호산업군: {', '.join(job_market['preferred_industries'][:5])}")
    if job_market.get("preferred_companies"):
        job_market_parts.append(f"우대기업: {', '.join(job_market['preferred_companies'][:5])}")
    if job_market.get("requirement_type"):
        job_market_parts.append(f"채용요건유형: {job_market['requirement_type']}")
    if job_market.get("public_sector_points"):
        job_market_parts.append(f"공공부문가산점: {job_market['public_sector_points']}")
    if job_market.get("salary_premium"):
        job_market_parts.append(f"연봉가산효과: {job_market['salary_premium']}")

    if job_market_parts:
        parts.append("")
        parts.append("[채용 시장 정보]")
        parts.extend(job_market_parts)

    # Cost breakdown (비용 정보)
    cost = cert.get("cost_breakdown", {}) or {}
    cost_parts = []
    if cost.get("exam_fee"):
        cost_parts.append(f"응시료: {cost['exam_fee']}")
    if cost.get("total_estimated_cost"):
        cost_parts.append(f"총예상비용: {cost['total_estimated_cost']}")
    if cost.get("free_resources"):
        cost_parts.append(f"무료자료: {', '.join(cost['free_resources'][:3])}")

    if cost_parts:
        parts.append("")
        parts.append("[비용 정보]")
        parts.extend(cost_parts)

    # Feasibility info (합격 가능성 정보)
    feasibility = cert.get("feasibility_info", {}) or {}
    feasibility_parts = []
    if feasibility.get("non_major_pass_rate"):
        feasibility_parts.append(f"비전공자합격률: {feasibility['non_major_pass_rate']}")
    if feasibility.get("self_study_possible") is not None:
        feasibility_parts.append(f"독학가능: {'가능' if feasibility['self_study_possible'] else '어려움'}")
    if feasibility.get("minimum_study_period"):
        feasibility_parts.append(f"최소준비기간: {feasibility['minimum_study_period']}일")
    if feasibility.get("working_adult_tips"):
        tips = feasibility["working_adult_tips"][:2]
        feasibility_parts.append(f"직장인팁: {' / '.join(tips)}")

    if feasibility_parts:
        parts.append("")
        parts.append("[합격 가능성 정보]")
        parts.extend(feasibility_parts)

    # Similar certificates (유사 자격증)
    similar = cert.get("similar_certificates", []) or []
    if similar:
        parts.append("")
        parts.append("[유사 자격증]")
        for sim in similar[:3]:  # 최대 3개
            if sim.get("title"):
                comparison = sim.get("comparison", "")
                parts.append(f"- {sim['title']}: {comparison}")

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

    # 취업준비생 관점 필드 처리 (NEW: 2026-01-28)
    job_market = cert.get("job_market_info", {}) or {}
    cost = cert.get("cost_breakdown", {}) or {}
    feasibility = cert.get("feasibility_info", {}) or {}
    schedule = cert.get("exam_schedule_detail", {}) or {}
    similar = cert.get("similar_certificates", []) or []

    # preferred_industries 처리
    preferred_industries = job_market.get("preferred_industries", [])
    if isinstance(preferred_industries, list):
        preferred_industries_str = ", ".join(preferred_industries[:5])
    else:
        preferred_industries_str = ""

    # preferred_companies 처리
    preferred_companies = job_market.get("preferred_companies", [])
    if isinstance(preferred_companies, list):
        preferred_companies_str = ", ".join(preferred_companies[:5])
    else:
        preferred_companies_str = ""

    # similar_certificates 처리
    similar_titles = [s.get("title", "") for s in similar[:3] if s.get("title")]
    similar_certificates_str = ", ".join(similar_titles)

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
        # 취업준비생 관점 필드 (NEW: 2026-01-28)
        "job_posting_frequency": job_market.get("job_posting_frequency", "") or "",
        "preferred_industries": preferred_industries_str[:200],
        "preferred_companies": preferred_companies_str[:200],
        "requirement_type": job_market.get("requirement_type", "") or "",
        "public_sector_points": (job_market.get("public_sector_points", "") or "")[:100],
        "salary_premium": (job_market.get("salary_premium", "") or "")[:100],
        "total_estimated_cost": (cost.get("total_estimated_cost", "") or "")[:100],
        "self_study_possible": feasibility.get("self_study_possible"),
        "non_major_pass_rate": (feasibility.get("non_major_pass_rate", "") or "")[:50],
        "minimum_study_period": feasibility.get("minimum_study_period"),
        "cbt_available": schedule.get("cbt_available"),
        "annual_exam_count": schedule.get("annual_exam_count"),
        "similar_certificates": similar_certificates_str[:200],
    }
