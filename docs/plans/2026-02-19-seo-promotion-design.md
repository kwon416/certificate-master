# SEO 홍보 전략 설계 문서

**Date:** 2026-02-19
**Goal:** 자격증 마스터 (cert.i-ve.ai) 검색엔진 노출 확보
**Approach:** 기술 SEO 완성 + Google/Naver Search Console 등록 + 누락 페이지 보완

---

## 현황 분석

### 이미 잘 구현된 것 ✅
- `robots.txt` — Googlebot, Yeti(네이버), Bingbot 크롤링 허용
- `sitemap.ts` — 정적 페이지 + 전체 자격증 동적 페이지 포함
- `layout.tsx` — WebSite + Organization JSON-LD 전역 삽입 (SearchAction 포함)
- `certificates/[id]/page.tsx` — 동적 메타데이터 + CertificateJsonLd + BreadcrumbList
- 랜딩 페이지 메타데이터 — title, description, OG, Twitter 완비
- `og-image.png` — public 폴더에 존재
- Google/Naver 사이트 인증 코드 — env 변수 연동 준비됨
- GA4 + GTM 코드 삽입됨

### 실제 검색 노출 없는 이유 ❌
1. **Google Search Console 미등록** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 환경변수 미설정
2. **Naver Search Advisor 미등록** — `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 환경변수 미설정
3. **sitemap에 404 페이지 포함** — `/about`, `/terms`, `/privacy`, `/community`가 sitemap에 등재되어 있으나 실제 페이지 없음 → 크롤러 신뢰도 하락
4. **신규 도메인** — 백링크 없어 도메인 권위(Authority) 낮음

---

## 아키텍처

```
[작업 A] sitemap 정리 + 누락 페이지 생성
    └─ sitemap.ts에서 없는 페이지 제거
    └─ /terms, /privacy 페이지 생성 (법적 필수)
    └─ /about 페이지 생성 (브랜드 SEO 도움)

[작업 B] Google Search Console 등록
    └─ 소유권 확인 메타태그 → NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 설정
    └─ sitemap.xml 제출

[작업 C] Naver Search Advisor 등록
    └─ 소유권 확인 메타태그 → NEXT_PUBLIC_NAVER_SITE_VERIFICATION 설정
    └─ sitemap.xml 제출

[작업 D] Organization JSON-LD 개선
    └─ sameAs에 SNS 계정 URL 추가 (있을 경우)
    └─ Organization에 이메일 실제값으로 교체
```

---

## 상세 설계

### Task 1: sitemap.ts 정리 (존재하지 않는 페이지 제거)

**문제:** `sitemap.ts`에 `/about`, `/community`가 등재되어 있으나 실제 페이지 없음
→ 크롤러가 404를 만나면 사이트 신뢰도 하락

**해결:**
- `sitemap.ts`에서 `/about`, `/community` 항목 제거
- `/terms`, `/privacy`는 생성 예정이므로 유지

---

### Task 2: 필수 법적 페이지 생성 (terms, privacy)

**파일:**
- `frontend/src/app/terms/page.tsx`
- `frontend/src/app/privacy/page.tsx`

**내용 구성:**
- 서비스 이용약관 (간단한 버전)
- 개인정보 처리방침 (Google OAuth, GA4 사용 명시)
- 각 페이지에 SEO 메타데이터 포함

**SEO 의의:**
- 법적 필수 페이지 없으면 Google 품질 평가에서 감점
- E-E-A-T (신뢰성) 지표 향상

---

### Task 3: About 페이지 생성

**파일:** `frontend/src/app/about/page.tsx`

**내용:**
- 서비스 소개 (자격증 마스터란?)
- 주요 기능 (AI 추천, 학습 플랜, 진행도 추적)
- 데이터 출처 (큐넷 공공데이터)
- 개발팀 소개 (선택)

**SEO 의의:**
- Organization 스키마와 연동하여 브랜드 신뢰도 상승
- "자격증 마스터" 브랜드 검색 시 사이트링크 노출 가능

---

### Task 4: Google Search Console 등록

**절차:**
1. https://search.google.com/search-console 접속
2. URL 접두어 방식으로 `https://cert.i-ve.ai` 등록
3. HTML 태그 방식 소유권 확인 선택
4. `<meta name="google-site-verification" content="...">` 값을 복사
5. `.env.production`에 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=복사한값` 추가
6. 배포 후 Search Console에서 "확인" 클릭
7. `sitemap.xml` 제출 (`https://cert.i-ve.ai/sitemap.xml`)

---

### Task 5: Naver Search Advisor 등록

**절차:**
1. https://searchadvisor.naver.com 접속
2. 사이트 등록 → `https://cert.i-ve.ai`
3. HTML 태그 방식 소유권 확인
4. `.env.production`에 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION=복사한값` 추가
5. 배포 후 확인
6. 사이트맵 제출

---

### Task 6: Organization JSON-LD sameAs 추가

**파일:** `frontend/src/components/seo/json-ld.tsx`

**현재:**
```json
"sameAs": []
```

**목표:**
```json
"sameAs": [
  "https://github.com/...",
  "https://www.instagram.com/...",
  ...
]
```

SNS 계정 생성 후 URL 추가. 구글이 Organization을 다른 플랫폼과 연결하여 브랜드 신뢰도 상승.

---

## 우선순위

| 우선순위 | Task | 효과 | 난이도 |
|---------|------|------|------|
| 1 | Task 4: Google Search Console 등록 | 🔴 핵심 — 인덱싱 시작 | 쉬움 (환경변수) |
| 2 | Task 1: sitemap 정리 | 🔴 크롤러 404 방지 | 쉬움 |
| 3 | Task 2: terms/privacy 페이지 | 🟡 법적+SEO 필수 | 보통 |
| 4 | Task 5: Naver Search Advisor | 🟡 네이버 노출 | 쉬움 |
| 5 | Task 3: About 페이지 | 🟢 브랜드 SEO | 보통 |
| 6 | Task 6: JSON-LD sameAs | 🟢 장기 신뢰도 | 쉬움 (SNS 생성 후) |

---

## 성공 지표

- Google Search Console에서 sitemap 제출 후 "처리된 URL" 수 확인
- 2주 후 구글에서 `site:cert.i-ve.ai` 검색 시 페이지 노출 여부 확인
- "자격증 마스터" 브랜드 검색 시 1위 노출
- 4주 후 주요 자격증 이름 검색 시 10페이지 내 노출 여부 확인
