# 자격증 취득 도우미 (Certificate Master) 기획안

**프로젝트명:** Certificate Master (자격증 마스터)  
**목표:** 1주일 MVP 출시  
**타겟 사용자:** 자격증 준비 중인 모든 사람 
**비즈니스 모델:** 프리미엄 구독(초기 제외) + 광고 (초기는 프리 모델)

---

## 1. 프로젝트 개요

### 1.1 문제 정의
- 자격증 준비생들이 **산재된 정보**를 일일이 찾아야 함 (큐넷, 유튜브, 네이버 카페 등)
- **신뢰할 수 있는 정보**의 부족 (커뮤니티 정보 vs 공식 정보 구분 어려움)
- **개인화된 학습 계획**이 없음
- **진행도 추적** 및 **동기부여** 부족

### 1.2 솔루션
한 곳에서 **자격증 정보 + 맞춤형 학습 플랜 + AI 가이드**를 제공하는 올인원 플랫폼

### 1.3 핵심 가치
- 🎯 **신뢰도:** 공공데이터 자격증 목록 데이터 + Brave API 웹 검색 기반
- ⚡ **속도:** LLM 기반 자동 요약으로 최신 정보 실시간 제공
- 🧠 **개인화:** 사용자 프로필 → 맞춤형 학습 계획 자동 생성
- 🎮 **동기부여:** 진행도 시각화, 레벨/배지 시스템

---

## 2. MVP 범위 (1주일)

### 2.1 핵심 기능

#### **Phase 1: 자격증 검색 & 상세 정보 (Day 1~3)**
```
사용자 검색 → 자격증 선택 → 상세 정보 페이지
  ├─ 기본정보: 난이도, 관리기관, 시험일정
  ├─ AI 요약: 자격증 개요 (Brave API + LLM)
  ├─ 공부플랜: 추천 준비기간 & 일일 계획 (AI 생성)
  ├─ 추천강의: 상위 3개 강의 (Brave 검색)
  └─ 시험정보: 다음 시험일, 합격률, 기출문제 링크
```

#### **Phase 2: 학습 진행도 추적 (Day 4~5)**
```
사용자가 선택한 자격증 → 진행도 대시보드
  ├─ 목표 설정: "3개월 안에 합격" → AI가 일일 마일스톤 생성
  ├─ 체크인: 매일 "오늘 뭐 공부했어?" 기록
  ├─ 진행도 시각화: 막대 그래프, 남은 일수
  └─ AI 응원: 진행도 저조 시 격려 메시지
```

#### **Phase 3: 커뮤니티 (선택, Day 6~7)**
```
자격증별 게시판
  ├─ 후기 공유 (텍스트)
  ├─ 질답 (태그 기반)
  └─ 공부팁 공유
```

---

## 3. 기술 아키텍처

### 3.1 데이터 플로우

```
┌─────────────────────────────────────────────────────┐
│ 1. 데이터 수집 & 처리                                   │
└─────────────────────────────────────────────────────┘
  
  엑셀 파일 (큐넷 자격증 정보)
    ↓ [파이썬 스크립트 ipynb 파일로 생성]
    └─→ 파싱 (자격구분, 계열, 종목)
        ├─ code: "S"
        ├─ category: "국가전문자격"
        ├─ series: "세무사"
        └─ title: "세무사"

┌─────────────────────────────────────────────────────┐
│ 2. 웹 검색 & LLM 요약                                 │
└─────────────────────────────────────────────────────┘

  자격증명 (예: "세무사")
    ↓ [Brave API 검색]
    ├─ "세무사 자격증 준비 기간"
    ├─ "세무사 공부 방법"
    ├─ "세무사 추천 강의"
    └─ "세무사 난이도"
    ↓ [결과 페이지 수집 + 요약]
    ↓ [LLM 정리]
    └─→ 구조화된 정보:
        {
          "overview": "...",
          "study_plan": "...",
          "recommended_lectures": [...],
          "difficulty": 4,
          "typical_period_days": 120
        }

┌─────────────────────────────────────────────────────┐
│ 3. 벡터 스토어 구성 (RAG)                             │
└─────────────────────────────────────────────────────┘

  구조화된 정보
    ↓ [임베딩 생성]
    └─→ OpenAI Embedding API 또는 다른 모델
    ↓ [벡터 스토어에 저장]
    └─→ Pinecone
        {
          "id": "cert_세무사",
          "vector": [0.123, 0.456, ...],
          "metadata": {
            "title": "세무사",
            "category": "국가전문자격",
            "series": "세무사",
            "overview": "...",
            "study_plan": "...",
            "difficulty": 4
          }
        }

┌─────────────────────────────────────────────────────┐
│ 4. 사용자 요청 → RAG 응답                             │
└─────────────────────────────────────────────────────┘

  사용자: "세무사 난이도는?" 또는 "3개월 안에 따기 쉬운 자격증"
    ↓ [사용자 쿼리 임베딩]
    ↓ [벡터 스토어 유사도 검색]
    ↓ [상위 3개 자격증 정보 수집]
    ↓ [LLM 프롬프트]
    └─→ "세무사는 난이도 4/5이고, 평균 4개월 준비가 필요합니다..."

```

### 3.2 시스템 아키텍처

```
Frontend (Next.js)
├─ 검색 페이지
├─ 자격증 상세 정보
├─ 학습 대시보드
└─ 커뮤니티

         ↕ (REST API / WebSocket)

Backend (Python FastAPI)
├─ API 서버
│  ├─ GET /certificates (검색)
│  ├─ GET /certificates/{id} (상세)
│  ├─ POST /study-plans (계획 생성)
│  └─ POST /checkins (체크인 기록)
│
├─ 배치 작업 (Async Task Queue)
│  ├─ 엑셀 파일 파싱 (1회)
│  ├─ Brave API 웹 검색 (일일 업데이트)
│  ├─ LLM 요약 및 정제
│  └─ 벡터스토어 동기화
│
├─ RAG 엔진
│  ├─ 쿼리 임베딩
│  ├─ 벡터스토어 검색
│  └─ LLM 답변 생성
│
└─ DB
   ├─ MySQL: 사용자, 자격증, 학습기록
   └─ Redis: 캐싱, 세션

         ↕ (API calls)

외부 서비스
├─ Brave Search API (웹 검색)
├─ OpenAI API (LLM + Embedding)
└─ 벡터스토어 (Pinecone / Milvus)

```

---

## 4. 데이터 구조

### 4.1 엑셀 파일 파싱 스펙

**입력 (엑셀):**
```
자격구분코드 | 자격구분명      | 계열명    | 종목명
S           | 국가전문자격   | 세무사    | 세무사
S           | 국가전문자격   | 관세사    | 관세사
S           | 국가전문자격   | 관광통역안내사 | 관광통역안내사(영어)
...
```

**출력 (JSON / DB):**
```json
{
  "cert_id": "S_세무사",
  "code": "S",
  "category_name": "국가전문자격",
  "series": "세무사",
  "title": "세무사",
  "status": "raw"  // "raw" → "enriched" (웹검색 완료 후)
}
```

### 4.2 웹 검색 + LLM 요약 결과

**저장 구조:**
```json
{
  "cert_id": "S_세무사",
  "title": "세무사",
  "enriched_at": "2026-01-06T14:00:00Z",
  
  // Brave API 검색 결과 + LLM 요약
  "overview": {
    "description": "세무사는 국가고시 자격증으로, 세금 관련 컨설팅 및 신고 대리 업무를 수행하는 전문가입니다.",
    "key_points": [
      "법인세, 소득세, 부가가치세 전문",
      "회계사와 다르게 세무만 담당",
      "독립 개업 가능한 고수익 자격증"
    ],
    "prospects": "연봉 5000만원대~"
  },
  
  "difficulty": {
    "score": 4.5,  // 1~5
    "description": "높은 난이도. 세법 암기량이 많고, 계산 문제도 어려움.",
    "pass_rate": 0.18  // 18% 합격률
  },
  
  "study_plan": {
    "recommended_period_days": 120,
    "typical_schedule": {
      "week_1_4": "기초 세법 (강의 + 요약)",
      "week_5_8": "심화 세법 (강의 + 문제풀이)",
      "week_9_12": "기출문제 반복 (모의고사 3회)"
    },
    "study_hours_per_week": 15,
    "tips": [
      "세법을 순서대로 학습하지 말고, 항상 기출문제와 함께",
      "계산 문제는 매일 10개 풀기",
      "최근 3년 기출문제는 100% 암기"
    ]
  },
  
  "recommended_lectures": [
    {
      "rank": 1,
      "title": "2026 세무사 1차 강의",
      "instructor": "OOO",
      "platform": "유데미",
      "price": 150000,
      "rating": 4.8,
      "reviews": 342,
      "url": "https://..."
    },
    // ... 2개 더
  ],
  
  "exam_info": {
    "next_exam_date": "2026-03-XX",
    "registration_period": "2026-02-XX ~ 2026-02-XX",
    "test_format": "객관식 4지선다 (1차 120문제 × 2과목, 2차 3과목)",
    "managing_organization": "한국세무사회"
  },
  
  "resources": {
    "official_website": "https://tax.go.kr",
    "practice_site": "https://comcbt.com",
    "communities": ["세무사 카페", "세무사 네이버 까페"]
  }
}
```

### 4.3 벡터스토어 스키마

**벡터 인덱스:**
```json
{
  "id": "S_세무사",
  "vector": [
    // 임베딩 벡터 (1536차원 또는 512차원)
    0.123, -0.456, 0.789, ..., 0.012
  ],
  "metadata": {
    "cert_id": "S_세무사",
    "title": "세무사",
    "category": "국가전문자격",
    "series": "세무사",
    "difficulty": 4.5,
    "pass_rate": 0.18,
    "study_period_days": 120,
    "overview": "...",
    "key_points": ["법인세", "소득세", "부가가치세"],
    "job_prospects": "5000만원대",
    "text_for_search": "세무사 세금 회계 법인세 소득세 부가가치세 자격증 고수익"
  }
}
```

**쿼리 예시:**
```
사용자 쿼리: "3개월 안에 취득할 수 있는 자격증"
  ↓ 임베딩
  ↓ 벡터스토어 검색 (상위 5개)
  ↓ LLM 필터링 + 추천
  ↓ 응답: "정보처리기사, SQL개발자, 공무원 9급 등이 추천됩니다"
```

---

## 5. UI/UX 플로우 설계

### 5.1 사용자 여정 (User Journey)

```
1단계: 랜딩 페이지
├─ 헤더: 로고, 검색창
├─ 슬로건: "자격증 준비, 이제 혼자가 아니야"
├─ 주요 기능 3개 소개 (카드)
│  ├─ 🔍 스마트 검색
│  ├─ 📚 AI 학습계획
│  └─ 📊 진행도 추적
├─ 인기 자격증 5개 (카루셀)
│  └─ "세무사", "정보처리기사", "공무원 9급", ...
└─ 회원가입 CTA 버튼

2단계: 검색 페이지
├─ 검색창 (자동완성)
│  └─ "세무사" 타이핑 → "세무사", "세무대리인", "세무상담사" 드롭다운
├─ 필터 (선택)
│  ├─ 난이도: 쉬움 ← → 어려움
│  ├─ 준비기간: 1개월 / 3개월 / 6개월+
│  └─ 분야: 금융, IT, 공무원, 기타
├─ 검색 결과 (카드 리스트)
│  ├─ 자격증명
│  ├─ 난이도 (별점)
│  ├─ 합격률
│  ├─ "상세보기" 버튼
│  └─ "관심 등록" 하트 버튼
└─ 페이지네이션

3단계: 자격증 상세 페이지
├─ 헤더
│  ├─ 자격증명 (세무사)
│  ├─ 난이도 / 합격률 / 시험일
│  └─ "학습 시작" 버튼
├─ 탭 메뉴
│  ├─ [개요] (기본정보)
│  ├─ [학습계획] (AI 생성)
│  ├─ [강의] (추천 강의)
│  ├─ [커뮤니티] (후기, 질답)
│  └─ [자료] (시험정보, 링크)
├─ [개요] 탭
│  ├─ 자격증 개요 (AI 요약)
│  ├─ 주요 특징 3개
│  ├─ 취업 전망 (연봉, 직무)
│  ├─ 관리 기관
│  └─ 공식 웹사이트 링크
├─ [학습계획] 탭
│  ├─ 목표 설정 폼
│  │  ├─ "목표 날짜" 선택 (달력)
│  │  ├─ "주당 공부 시간" 선택 (슬라이더)
│  │  └─ "생성" 버튼
│  ├─ AI 생성 계획 (시간라인)
│  │  ├─ 1주차: 기초 이론 (강의 + 요약)
│  │  ├─ 2주차: 심화 이론 (강의 + 문제풀이)
│  │  └─ ...
│  └─ "이 계획 시작" 버튼
├─ [강의] 탭
│  ├─ 상위 3개 강의 (카드)
│  │  ├─ 강의명
│  │  ├─ 강사
│  │  ├─ 플랫폼 (유데미, 인프런 등)
│  │  ├─ 가격
│  │  ├─ 평점 / 리뷰수
│  │  └─ "바로가기" 링크
│  └─ "더 많은 강의 보기" (Brave 검색 결과)
└─ [자료] 탭
   ├─ 시험일정
   ├─ 기출문제 링크
   ├─ 공식 커뮤니티 링크
   └─ 추천 교재

4단계: 학습 시작 (대시보드)
├─ 헤더
│  ├─ "세무사 준비 중"
│  └─ "D-45" (남은 일수)
├─ 프로그레스 바
│  ├─ 전체 진행도 (35%)
│  ├─ 현재 단계: "기초 이론 60%" → "심화 이론 0%"
│  └─ "2주 앞서가는 중" (격려 메시지)
├─ 오늘의 일정
│  ├─ "세법 1강 시청"
│  ├─ "문제 10개 풀기"
│  └─ "체크인" 버튼
├─ 학습 기록 (주간 그래프)
│  └─ 월~일 학습시간 시각화
├─ AI 응원 메시지
│  └─ "어제 좋은 진행 했어요! 계속 화이팅! 🔥"
└─ 커뮤니티 피드 (최신 후기 2개)
```

### 5.2 UI 컴포넌트 설계

#### **검색 결과 카드**
```
┌─────────────────────────────┐
│ [♡] 세무사                   │ ← 관심등록
│                              │
│ ⭐⭐⭐⭐ (4.5/5)            │ ← 난이도
│ 18% 합격률  │  평균 4개월   │ ← 핵심정보
│                              │
│ 세금 관련 컨설팅 및 신고     │ ← 한줄 설명
│ 대리 업무를 수행하는...     │
│                              │
│ [상세보기]     [강의찾기]    │ ← CTA 버튼
└─────────────────────────────┘
```

#### **학습계획 타임라인**
```
대시보드 → [학습계획]

│ 목표: 2026-06-30까지 세무사 합격
│ 주당: 15시간
│
├─ [주차 1~2] 기초 세법
│  ├─ 강의: "세법 기초 이론" (10시간)
│  ├─ 정리: 핵심 요약정리 (3시간)
│  └─ 점검: 학습 완료 체크 ☐
│
├─ [주차 3~4] 심화 세법
│  ├─ 강의: "법인세 심화" (10시간)
│  ├─ 문제풀이: 기출문제 50개 (5시간)
│  └─ 점검: 학습 완료 체크 ☐
│
└─ [주차 5~6] 모의고사
   ├─ 모의고사: 3회 (12시간)
   ├─ 오답정리: 틀린 문제 분석 (3시간)
   └─ 점검: 학습 완료 체크 ☐

[AI가 생성한 시간안내]
→ 한 주에 15시간 × 6주 = 총 90시간
→ 당신의 목표 기간: 2026-06-30 (D-175)
→ 여유 있는 계획입니다! ✅
```

#### **대시보드 (학습 진행도)**
```
┌────────────────────────────────┐
│ 세무사 준비 중      D-45        │ ← 남은일수
├────────────────────────────────┤
│ 전체 진행도                     │
│ ████████░░░░░░░░░░░░  35%     │ ← 진행바
│ 2주 앞서가는 중 🚀              │ ← 격려
├────────────────────────────────┤
│ 현재 단계                       │
│ 📚 기초 이론 ████████░  60%    │
│ 📖 심화 이론 ░░░░░░░░░  0%    │
│ 📝 기출문제 ░░░░░░░░░  0%    │
├────────────────────────────────┤
│ 오늘의 일정                     │
│ ☐ 세법 1강 시청 (40분)         │
│ ☐ 문제 10개 풀기 (1시간)       │
│ [오늘 체크인]                   │
├────────────────────────────────┤
│ 주간 학습시간 (시간)            │
│ Mon Tue Wed Thu Fri Sat Sun    │
│  3   4   3   5   4   2   1     │
│ ━━━━━━━━━━━━━━━━ 평균: 3.2h  │
├────────────────────────────────┤
│ 💡 AI 응원 메시지              │
│ "어제 좋은 진행했어요!          │
│  계속 이 속도면 목표 달성!      │
│  화이팅! 🔥"                   │
└────────────────────────────────┘
```

### 5.3 커뮤니티 (경량화)

**전략:** "자격증별 미니 게시판" 아니라 "통합 게시판 + 태그"

```
커뮤니티 페이지
├─ 태그 필터
│  ├─ [세무사] (12개 글)
│  ├─ [공무원 9급] (45개 글)
│  ├─ [정보처리기사] (38개 글)
│  ├─ [금융자격] (22개 글)
│  └─ [기타] (15개 글)
├─ 작성순 / 인기순 탭
├─ 글 목록
│  ├─ 제목: "세무사 1년 합격 후기입니다"
│  │   태그: #세무사 #합격
│  │   작성자: 익명
│  │   조회: 234
│  │   댓글: 12
│  │
│  └─ 제목: "공무원 시험 떨어졌어요..."
│      태그: #공무원 #위로
│      작성자: 익명
│      조회: 89
│      댓글: 23
└─ [글쓰기] 버튼
```

---

## 6. 백엔드 구현 우선순위

### **Day 1~2: 데이터 준비**
```
- 엑셀 파일 파싱 (자격증 목록 추출)
- 파싱된 데이터 → JSON (10~50개 자격증)
- DB 테이블 생성 (Certificate, UserProfile, StudyPlan)
```

### **Day 3~4: Brave API + LLM 통합**
```
- Brave Search API 설정
- 웹 검색 → 결과 페이지 수집
- OpenAI API로 요약 및 구조화
- 결과 DB 저장
```

### **Day 5: 벡터스토어 구성**
```
- OpenAI Embedding API로 임베딩 생성
- Pinecone / Milvus에 저장
- 벡터 검색 엔드포인트 작성
```

### **Day 6: API 엔드포인트**
```
- GET /api/certificates (검색)
- GET /api/certificates/{id} (상세)
- POST /api/study-plans (계획 생성)
- POST /api/checkins (체크인)
```

### **Day 7: 테스트 + 배포**
```
- 통합 테스트
- 에러 핸들링
- 배포 (Heroku / AWS)
```

---

## 7. 기술 스택

### **백엔드**
```
Framework: Python FastAPI
Database: PostgreSQL 
Cache: Redis
Async Queue: Celery (Python) 또는 Spring Batch (Java)
AI/LLM: OpenAI API (GPT-4, Embedding)
Search API: Brave Search API
Vector Store: Pinecone (또는 Milvus, Weaviate)
```

### **프론트엔드**
```
Framework: Next.js 14 (React)
Styling: Tailwind CSS + shadcn/ui
State Management: Zustand 또는 Jotai
API Client: TanStack Query
Real-time: WebSocket (나중에)
```

### **배포**
```
Backend: Docker + AWS EC2 또는 Heroku
Frontend: Vercel
Database: AWS RDS
```

---

## 8. 데이터 흐름 상세 (벡터스토어)

### 8.1 초기화 (온보딩)

```python
# 1단계: 엑셀 파일 파싱
import pandas as pd
import json

excel_file = "credentials.xlsx"  # 큐넷 데이터
df = pd.read_excel(excel_file)

certificates = []
for _, row in df.iterrows():
    cert = {
        "cert_id": f"{row['자격구분코드']}_{row['종목명']}",
        "code": row['자격구분코드'],
        "category_name": row['자격구분명'],
        "series": row['계열명'],
        "title": row['종목명'],
        "status": "raw"
    }
    certificates.append(cert)

with open('certificates_raw.json', 'w', encoding='utf-8') as f:
    json.dump(certificates, f, ensure_ascii=False, indent=2)

# 결과: certificates_raw.json (50~100개 자격증)
```

```python
# 2단계: Brave API로 웹 검색 + LLM 요약 (배치 작업)
import requests
import openai
from datetime import datetime

BRAVE_API_KEY = "..."
OPENAI_API_KEY = "..."

def enrich_certificate(cert):
    """자격증 정보를 웹 검색으로 보강"""
    
    title = cert['title']
    
    # Brave API 검색
    queries = [
        f"{title} 자격증 준비 기간",
        f"{title} 공부 방법 팁",
        f"{title} 추천 강의",
        f"{title} 난이도 합격률"
    ]
    
    search_results = []
    for q in queries:
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"X-Subscription-Token": BRAVE_API_KEY},
            params={"q": q, "count": 5}
        )
        search_results.extend(resp.json()['web'][:3])
    
    # 검색 결과 텍스트 추출
    context = "\n".join([
        f"제목: {r.get('title', '')}\n내용: {r.get('description', '')}"
        for r in search_results
    ])
    
    # LLM으로 요약 및 구조화
    prompt = f"""
    다음 자격증 "{title}"에 대한 검색 결과를 바탕으로 JSON 형식으로 정리해줘.
    
    검색 결과:
    {context}
    
    다음 항목을 JSON으로 반환해:
    {{
        "overview": "자격증 개요 (2-3문장)",
        "key_points": ["핵심 특징 1", "핵심 특징 2", "핵심 특징 3"],
        "difficulty": 난이도 (1~5),
        "pass_rate": 합격률 (0~1),
        "study_period_days": 권장 준비기간 (일수),
        "study_tips": ["팁1", "팁2", "팁3"],
        "job_prospects": "취업 전망 (연봉, 직무)",
        "recommended_lectures": [
            {{"name": "강의명", "platform": "유데미/인프런/패스트캠퍼스", "price": 가격}}
        ]
    }}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    enriched_data = json.loads(response.choices[0].message.content)
    
    return {
        **cert,
        "status": "enriched",
        "enriched_at": datetime.now().isoformat(),
        **enriched_data
    }

# 배치 실행
def batch_enrich_all_certificates():
    with open('certificates_raw.json', 'r', encoding='utf-8') as f:
        certs = json.load(f)
    
    enriched = []
    for cert in certs[:10]:  # MVP: 상위 10개만
        try:
            enriched_cert = enrich_certificate(cert)
            enriched.append(enriched_cert)
            print(f"✅ {cert['title']} 완료")
        except Exception as e:
            print(f"❌ {cert['title']} 실패: {e}")
    
    with open('certificates_enriched.json', 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    batch_enrich_all_certificates()

# 결과: certificates_enriched.json (10개, 풍부한 정보)
```

```python
# 3단계: 벡터 생성 및 저장 (Pinecone)
import openai
import pinecone
import json

OPENAI_API_KEY = "..."
PINECONE_API_KEY = "..."
PINECONE_INDEX = "certificates"

def create_embeddings_and_store():
    # Pinecone 초기화
    pinecone.init(api_key=PINECONE_API_KEY, environment="us-west1-gcp")
    index = pinecone.Index(PINECONE_INDEX)
    
    # 풍부한 자격증 정보 로드
    with open('certificates_enriched.json', 'r', encoding='utf-8') as f:
        certs = json.load(f)
    
    vectors_to_upsert = []
    
    for cert in certs:
        # 임베딩할 텍스트 구성
        text_to_embed = f"""
        {cert['title']}
        {cert['overview']}
        {' '.join(cert['key_points'])}
        {cert['job_prospects']}
        """
        
        # OpenAI Embedding 생성
        embedding = openai.Embedding.create(
            model="text-embedding-3-small",
            input=text_to_embed
        )['data'][0]['embedding']
        
        # Pinecone에 저장할 벡터
        vector = (
            cert['cert_id'],
            embedding,
            {
                "title": cert['title'],
                "category": cert['category_name'],
                "series": cert['series'],
                "difficulty": cert['difficulty'],
                "pass_rate": cert['pass_rate'],
                "study_period": cert['study_period_days'],
                "overview": cert['overview'],
                "key_points": json.dumps(cert['key_points']),
                "prospects": cert['job_prospects'],
                "lectures": json.dumps(cert['recommended_lectures'])
            }
        )
        
        vectors_to_upsert.append(vector)
    
    # Pinecone에 배치 업로드
    index.upsert(vectors=vectors_to_upsert, namespace="cert-master")
    
    print(f"✅ {len(vectors_to_upsert)}개 자격증이 벡터스토어에 저장되었습니다.")

if __name__ == "__main__":
    create_embeddings_and_store()
```

### 8.2 사용자 검색 (RAG)

```python
# 사용자가 검색할 때의 플로우

from flask import Flask, request, jsonify
import openai
import pinecone

app = Flask(__name__)

@app.route('/api/certificates/search', methods=['GET'])
def search_certificates():
    """
    쿼리 예시:
    - GET /api/certificates/search?q=세무사
    - GET /api/certificates/search?q=3개월 안에 취득 가능
    - GET /api/certificates/search?q=높은 연봉 자격증
    """
    
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"error": "검색어가 없습니다"}), 400
    
    # 1단계: 사용자 쿼리 임베딩
    query_embedding = openai.Embedding.create(
        model="text-embedding-3-small",
        input=query
    )['data'][0]['embedding']
    
    # 2단계: 벡터스토어에서 유사한 자격증 검색
    index = pinecone.Index("certificates")
    search_results = index.query(
        vector=query_embedding,
        top_k=5,
        namespace="cert-master",
        include_metadata=True
    )
    
    # 3단계: 검색 결과를 구조화된 데이터로 변환
    results = []
    for match in search_results['matches']:
        results.append({
            "cert_id": match['id'],
            "title": match['metadata']['title'],
            "category": match['metadata']['category'],
            "difficulty": match['metadata']['difficulty'],
            "pass_rate": match['metadata']['pass_rate'],
            "study_period": match['metadata']['study_period'],
            "overview": match['metadata']['overview'],
            "similarity_score": match['score']  # 유사도 점수
        })
    
    return jsonify({
        "query": query,
        "count": len(results),
        "results": results
    })

@app.route('/api/certificates/<cert_id>', methods=['GET'])
def get_certificate_detail(cert_id):
    """자격증 상세 정보 조회"""
    
    index = pinecone.Index("certificates")
    
    # Pinecone에서 정확한 ID로 조회
    # (실제로는 DB에서 조회하는 게 더 효율적)
    
    results = index.query(
        vector=[0] * 1536,  # 더미 벡터
        top_k=1000,
        namespace="cert-master",
        filter={"cert_id": {"$eq": cert_id}},
        include_metadata=True
    )
    
    if not results['matches']:
        return jsonify({"error": "자격증을 찾을 수 없습니다"}), 404
    
    match = results['matches'][0]
    
    return jsonify({
        "cert_id": match['id'],
        "title": match['metadata']['title'],
        "category": match['metadata']['category'],
        "difficulty": match['metadata']['difficulty'],
        "pass_rate": match['metadata']['pass_rate'],
        "study_period": match['metadata']['study_period'],
        "overview": match['metadata']['overview'],
        "key_points": json.loads(match['metadata']['key_points']),
        "prospects": match['metadata']['prospects'],
        "recommended_lectures": json.loads(match['metadata']['lectures'])
    })

if __name__ == "__main__":
    app.run(debug=True, port=8000)
```

---

## 9. 1주일 일정 (Day by Day)

### **Day 1 (월): 기초 설정 + 데이터 수집**
- [ ] GitHub 저장소 생성
- [ ] 프로젝트 구조 설계
- [ ] 엑셀 파일 파싱 스크립트 작성
- [ ] 자격증 10~20개 목록 JSON 생성
- **산출물:** `certificates_raw.json`

### **Day 2 (화): Brave API + LLM 통합**
- [ ] Brave Search API 셋업 (API 키 발급)
- [ ] OpenAI API 셋업 (GPT-4, Embedding)
- [ ] 웹 검색 스크립트 작성
- [ ] LLM 요약 프롬프트 최적화
- [ ] 배치 작업 실행 (상위 10개 자격증)
- **산출물:** `certificates_enriched.json`

### **Day 3 (수): 벡터스토어 구성**
- [ ] Pinecone 계정 생성 + 초기화
- [ ] 임베딩 생성 스크립트
- [ ] 벡터스토어 데이터 업로드
- [ ] 벡터 검색 로직 테스트
- **산출물:** Pinecone 인덱스 생성

### **Day 4 (목): 백엔드 API 개발**
- [ ] Spring Boot 프로젝트 초기 설정
- [ ] DB 스키마 설계 (Certificate, User, StudyPlan)
- [ ] API 엔드포인트 작성
  - `GET /api/certificates/search`
  - `GET /api/certificates/{id}`
  - `POST /api/study-plans`
- [ ] 벡터스토어 검색 통합
- **산출물:** 동작하는 백엔드 API

### **Day 5 (금): 프론트엔드 기초**
- [ ] Next.js 프로젝트 생성
- [ ] 레이아웃 구성 (Header, Footer)
- [ ] 검색 페이지 UI
- [ ] 자격증 상세 페이지 UI (상세보기)
- [ ] API 연동 (TanStack Query)
- **산출물:** 검색 + 상세보기 기능 완성

### **Day 6 (토): 학습 대시보드**
- [ ] 학습계획 생성 UI
- [ ] 학습 대시보드 UI
- [ ] 체크인 기능
- [ ] 진행도 시각화
- **산출물:** 완성된 학습 플로우

### **Day 7 (일): 마무리 + 배포**
- [ ] 버그 수정
- [ ] 성능 최적화
- [ ] 배포 (Heroku / Vercel)
- [ ] README 작성
- **산출물:** 배포된 MVP 서비스

---

## 10. 예상 결과물 (1주일 후)

### ✅ 동작 중인 기능
```
1. 자격증 검색 (자동완성)
2. 자격증 상세정보 조회 (AI 요약)
3. 추천 강의 조회
4. 학습계획 자동 생성 (AI)
5. 학습 진행도 추적
6. 체크인 기능
```

### 📊 기대 효과
```
- 취준생 입장에서 "한 곳에서 모든 정보 조회 가능"
- 포트폴리오: WebSearch API + LLM + RAG + 벡터스토어 통합 시스템
- 확장성: CBT 문제집, 커뮤니티 쉽게 추가 가능
```

### 🎯 포스트-MVP (이후 추가)
```
- 기출문제 CBT (한두개 자격증부터 시작)
- 커뮤니티 (태그 기반 게시판)
- 사용자 맞춤 추천 (벡터 기반)
- 푸시 알림 (매일 격려 메시지)
- 프리미엄 결제 (광고 제거, 심화 기능)
```

---

## 11. 참고 자료

### API 문서
- [Brave Search API](https://api.search.brave.com/res/v1/web/search)
- [OpenAI API (GPT-4, Embedding)](https://platform.openai.com/docs)
- [Pinecone Vector Database](https://www.pinecone.io/docs)

### 데이터 출처
- 큐넷: https://www.q-net.or.kr/
- GitHub 기출문제: `github.com/search?q=certification exam`

### 라이브러리
```
Python:
- pandas (엑셀 파싱)
- requests (HTTP 요청)
- pinecone (벡터스토어)
- openai (LLM + Embedding)
- flask (간단한 API 서버)

Java:
- Spring Boot 3.x
- OpenAI Java SDK
- Pinecone Java Client
```

---

## 12. 성공 지표

### MVP 성공 기준
1. ✅ 10개 이상 자격증 정보 DB 구성
2. ✅ 검색 기능 동작
3. ✅ AI 생성 학습계획 동작
4. ✅ 진행도 추적 동작
5. ✅ 배포 완료 (실제 접속 가능)

### 추가 목표 (2주차 이후)
1. 50개 이상 자격증 정보
2. CBT 문제집 (3개 자격증)
3. 커뮤니티 (텍스트 글쓰기)
4. 사용자 수 100명 이상
5. GitHub 스타 ⭐100개

---

**이제 구현을 시작하면 돼! 🚀**
