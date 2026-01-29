"""추천 이유 개인화 테스트 (변경된 Stepper 로직 반영).

TDD: current_status, study_commitment 기반 다양한 추천 멘트 생성 검증.
"""

import pytest
from datetime import datetime
from unittest.mock import MagicMock

from app.schemas.recommendation import RecommendationRequest
from app.schemas.certificate import Certificate
from app.services.study.recommendation_service import RecommendationService


def make_certificate(**kwargs) -> Certificate:
    """테스트용 Certificate 객체 생성 헬퍼."""
    defaults = {
        "id": "test-cert-id",
        "title": "테스트 자격증",
        "raw_id": "TEST001",
        "categories": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "difficulty": 3,
        "study_period_days": 90,
        "career_info": {},
        "job_market_info": {},
        "feasibility_info": {},
    }
    defaults.update(kwargs)
    return Certificate(**defaults)


class TestPurposeBasedReasonIntro:
    """purpose(목적) 기반 첫 문장 테스트."""

    def test_employment_purpose_intro(self):
        """취업 목적에서 취업 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            career_info={"related_jobs": ["소프트웨어 개발자"]},
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
        )

        intro = service._build_purpose_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        assert any(kw in intro for kw in [
            "취업", "채용", "입사", "경쟁력", "준비", "지원"
        ])

    def test_hobby_purpose_intro(self):
        """개인 관심/교양 목적에서 교양 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="한국사능력검정시험",
            difficulty=2,
        )

        request = RecommendationRequest(
            purpose="개인 관심 / 교양",
            interest_domains=["교육"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
        )

        intro = service._build_purpose_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        assert any(kw in intro for kw in [
            "관심", "교양", "자기계발", "취미", "탐구", "도전", "배울"
        ])

    def test_career_expertise_purpose_intro(self):
        """커리어 전문성 강화 목적에서 전문성 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보관리기술사",
            difficulty=5,
        )

        request = RecommendationRequest(
            purpose="커리어 전문성 강화",
            interest_domains=["IT개발"],
            study_timeline="1년 이상",
            difficulty_preference="어려워도 상관없음",
        )

        intro = service._build_purpose_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        assert any(kw in intro for kw in [
            "전문성", "전문가", "역량", "성장", "입지", "높여"
        ])


class TestStatusBasedReasonIntro:
    """current_status 기반 인트로 문구 테스트."""

    def test_student_status_intro(self):
        """student 상태에서 취업 준비 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            career_info={
                "related_jobs": ["소프트웨어 개발자", "시스템 엔지니어"],
                "industry": ["IT", "소프트웨어"],
            },
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            current_status="student",
        )

        intro = service._build_status_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        # 학생/취준생 관련 키워드 포함 (템플릿 다양성 고려)
        assert any(kw in intro for kw in [
            "취업", "준비", "입문", "시작", "첫", "신입",
            "취준생", "경쟁력", "도전", "인기", "유리", "지원"
        ])

    def test_senior_worker_status_intro(self):
        """senior_worker 상태에서 전문성 강화 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보관리기술사",
            difficulty=5,
            career_info={
                "related_jobs": ["IT 컨설턴트", "CTO"],
                "industry": ["IT", "컨설팅"],
            },
        )

        request = RecommendationRequest(
            purpose="커리어 전문성 강화",
            interest_domains=["IT개발"],
            study_timeline="1년 이상",
            difficulty_preference="어려워도 상관없음",
            current_status="senior_worker",
        )

        intro = service._build_status_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        # 경력자/전문성 관련 키워드 포함 (템플릿 다양성 고려)
        assert any(kw in intro for kw in [
            "전문성", "경력", "심화", "고급", "리더", "전환",
            "4년차", "입지", "역량", "커리어", "직무", "포트폴리오", "단기"
        ])

    def test_career_break_status_intro(self):
        """career_break 상태에서 재취업/새 시작 관련 인트로 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="컴퓨터활용능력1급",
            difficulty=2,
            career_info={
                "related_jobs": ["사무직", "경리"],
            },
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["총무/법무/사무"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            current_status="career_break",
        )

        intro = service._build_status_based_intro(cert, request)
        assert intro is not None
        assert len(intro) > 0
        # 재취업/새 시작 관련 키워드 포함
        assert any(kw in intro for kw in ["재취업", "새로운", "복귀", "재시작", "경력 단절"])


class TestCommitmentBasedPhrase:
    """study_commitment 기반 문구 테스트."""

    def test_relaxed_commitment_phrase(self):
        """relaxed 투자에서 여유로운 학습 관련 문구 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="한국사능력검정시험",
            difficulty=2,
            study_period_days=30,
        )

        request = RecommendationRequest(
            purpose="개인 관심 / 교양",
            interest_domains=["교육"],
            study_timeline="3개월 이하",
            difficulty_preference="쉬운 편",
            study_commitment="relaxed",
        )

        phrase = service._build_commitment_based_phrase(cert, request)
        assert phrase is not None
        assert len(phrase) > 0
        # 여유로운 학습 관련 키워드 포함 (템플릿 다양성 고려)
        assert any(kw in phrase for kw in [
            "여유", "부담", "천천히", "틈틈이", "병행",
            "일상", "주말", "출퇴근", "충분히", "가능"
        ])

    def test_intensive_commitment_phrase(self):
        """intensive 투자에서 집중 학습 관련 문구 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="중간",
            study_commitment="intensive",
        )

        phrase = service._build_commitment_based_phrase(cert, request)
        assert phrase is not None
        assert len(phrase) > 0
        # 집중 학습 관련 키워드 포함
        assert any(kw in phrase for kw in ["집중", "단기", "빠르게", "효율", "몰입"])

    def test_unsure_commitment_phrase(self):
        """unsure 투자에서 유연한 문구 생성."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="상관없음",
            difficulty_preference="어려워도 상관없음",
            study_commitment="unsure",
        )

        phrase = service._build_commitment_based_phrase(cert, request)
        assert phrase is not None
        assert len(phrase) > 0
        # 유연함 관련 키워드 포함 (템플릿 다양성 고려)
        assert any(kw in phrase for kw in [
            "자신", "페이스", "유연", "맞춰", "조절",
            "상황", "부담", "시작", "진행"
        ])


class TestDiverseReasonGeneration:
    """다양한 추천 이유 생성 테스트."""

    def test_reasons_vary_by_certificate(self):
        """자격증마다 다른 추천 이유가 생성되어야 함."""
        service = RecommendationService(db=MagicMock())

        cert1 = make_certificate(
            id="cert-1",
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
            career_info={
                "related_jobs": ["소프트웨어 개발자"],
                "industry": ["IT"],
            },
        )

        cert2 = make_certificate(
            id="cert-2",
            title="빅데이터분석기사",
            difficulty=3,
            study_period_days=120,
            career_info={
                "related_jobs": ["데이터 분석가", "데이터 사이언티스트"],
                "industry": ["데이터", "AI"],
            },
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            current_status="student",
            study_commitment="moderate",
        )

        reason1 = service._generate_reason(cert1, request)
        reason2 = service._generate_reason(cert2, request)

        # 두 이유가 달라야 함
        assert reason1 != reason2, "자격증마다 다른 추천 이유가 생성되어야 함"

    def test_reason_includes_certificate_specific_info(self):
        """추천 이유에 자격증별 고유 정보가 포함되어야 함."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
            career_info={
                "related_jobs": ["소프트웨어 개발자", "시스템 엔지니어"],
                "use_cases": ["SW 개발", "시스템 분석"],
            },
            job_market_info={
                "requirement_type": "우대",
                "preferred_industries": ["IT", "금융"],
            },
        )

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            current_status="student",
            study_commitment="moderate",
        )

        reason = service._generate_reason(cert, request)

        # 자격증 고유 정보 중 하나는 포함되어야 함
        assert any(
            info in reason
            for info in ["개발", "IT", "시스템", "소프트웨어", "금융"]
        ), f"추천 이유에 자격증 고유 정보가 없음: {reason}"


class TestReasonTemplateVariety:
    """추천 이유 템플릿 다양성 테스트."""

    def test_multiple_reasons_have_variety(self):
        """여러 자격증의 추천 이유가 템플릿 다양성을 가져야 함."""
        service = RecommendationService(db=MagicMock())

        certs = [
            make_certificate(
                id=f"cert-{i}",
                title=f"자격증{i}",
                difficulty=2 + (i % 3),
                study_period_days=60 + i * 30,
                career_info={
                    "related_jobs": [f"직업{i}A", f"직업{i}B"],
                    "industry": [f"산업{i}"],
                },
            )
            for i in range(5)
        ]

        request = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="중간",
            current_status="student",
            study_commitment="moderate",
        )

        reasons = [service._generate_reason(cert, request) for cert in certs]

        # 모든 이유가 동일하면 안 됨
        unique_reasons = set(reasons)
        assert len(unique_reasons) >= 3, f"추천 이유에 다양성이 부족함: {len(unique_reasons)}/5"


class TestIntegratedReasonWithNewFields:
    """새 필드 통합 추천 이유 테스트."""

    def test_reason_reflects_current_status_and_commitment(self):
        """추천 이유가 current_status와 study_commitment를 반영해야 함."""
        service = RecommendationService(db=MagicMock())

        cert = make_certificate(
            title="정보처리기사",
            difficulty=3,
            study_period_days=90,
            career_info={
                "related_jobs": ["소프트웨어 개발자"],
            },
        )

        # 학생 + 여유 있게
        request1 = RecommendationRequest(
            purpose="취업",
            interest_domains=["IT개발"],
            study_timeline="6개월 이하",
            difficulty_preference="쉬운 편",
            current_status="student",
            study_commitment="relaxed",
        )

        # 경력자 + 집중해서
        request2 = RecommendationRequest(
            purpose="커리어 전문성 강화",
            interest_domains=["IT개발"],
            study_timeline="3개월 이하",
            difficulty_preference="어려워도 상관없음",
            current_status="senior_worker",
            study_commitment="intensive",
        )

        reason1 = service._generate_reason(cert, request1)
        reason2 = service._generate_reason(cert, request2)

        # 같은 자격증이어도 사용자 상황에 따라 다른 이유
        assert reason1 != reason2, "사용자 상황에 따라 다른 추천 이유가 생성되어야 함"
