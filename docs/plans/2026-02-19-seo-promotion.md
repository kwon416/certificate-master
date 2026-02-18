# SEO 홍보 전략 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** cert.i-ve.ai 검색엔진 노출 확보 — sitemap 정리, 누락 페이지 생성, Google/Naver Search Console 등록 환경변수 연동

**Architecture:** sitemap에서 존재하지 않는 `/community` 항목을 제거하고, 법적 필수인 `/terms`, `/privacy`와 브랜드 SEO를 위한 `/about` 페이지를 신규 생성한다. Google/Naver 소유권 인증을 위한 환경변수 연동을 완성하여 검색엔진 인덱싱의 전제조건을 완성한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui

**Design Doc:** `docs/plans/2026-02-19-seo-promotion-design.md`

---

## Task 1: sitemap.ts에서 존재하지 않는 /community 제거

**Files:**
- Modify: `frontend/src/app/sitemap.ts:40-45`

### Step 1: 현재 상태 확인

`frontend/src/app/sitemap.ts` 를 열어 정적 페이지 목록 확인.
현재 `/about`, `/community`, `/terms`, `/privacy` 4개가 등재되어 있음.
`/about`, `/terms`, `/privacy`는 이번 PR에서 생성할 예정이므로 유지.
`/community`는 아직 구현 계획 없으므로 제거.

### Step 2: sitemap.ts에서 /community 항목 제거

`frontend/src/app/sitemap.ts` 의 staticPages 배열에서 아래 블록을 삭제:

```typescript
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
```

### Step 3: 빌드 확인

Run: `cd frontend && npm run build`
Expected: 빌드 성공, 타입 에러 없음

### Step 4: Commit

```bash
git add frontend/src/app/sitemap.ts
git commit -m "fix: remove non-existent /community from sitemap"
```

---

## Task 2: 이용약관 페이지 생성 (/terms)

**Files:**
- Create: `frontend/src/app/terms/page.tsx`

### Step 1: 테스트 작성

`frontend/tests/e2e/terms.spec.ts` 신규 생성:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Terms Page', () => {
  test('should render terms page', async ({ page }) => {
    await page.goto('/terms')
    await expect(page).toHaveTitle(/이용약관.*자격증 마스터/)
  })

  test('should have main heading', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { name: '이용약관' })).toBeVisible()
  })

  test('should have correct canonical URL in meta', async ({ page }) => {
    await page.goto('/terms')
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', /\/terms$/)
  })
})
```

### Step 2: 테스트 실패 확인

Run: `cd frontend && npx playwright test tests/e2e/terms.spec.ts --reporter=line`
Expected: FAIL — 페이지가 없어서 404 반환

### Step 3: terms 페이지 구현

`frontend/src/app/terms/page.tsx` 생성:

```typescript
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '이용약관',
  description: '자격증 마스터 서비스 이용약관입니다. 서비스 이용 전 반드시 읽어주세요.',
  openGraph: {
    title: '이용약관 | 자격증 마스터',
    description: '자격증 마스터 서비스 이용약관입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/terms`,
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">이용약관</h1>
      <p className="text-sm text-muted-foreground mb-8">
        최종 수정일: 2026년 2월 19일
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
        <p className="text-muted-foreground leading-relaxed">
          이 약관은 자격증 마스터(이하 "서비스")가 제공하는 자격증 정보 및 학습 계획 서비스의 이용과 관련하여
          서비스와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제2조 (서비스 내용)</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          서비스는 다음과 같은 기능을 제공합니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>국가자격증 정보 검색 및 비교</li>
          <li>AI 기반 자격증 추천</li>
          <li>맞춤형 학습 계획 생성 및 관리</li>
          <li>학습 진행도 추적 및 체크인</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제3조 (이용자 의무)</h2>
        <p className="text-muted-foreground leading-relaxed">
          이용자는 서비스를 이용함에 있어 다음 행위를 해서는 안 됩니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
          <li>타인의 정보 도용 또는 허위 정보 제공</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>서비스에서 얻은 정보를 무단으로 상업적으로 이용하는 행위</li>
          <li>기타 관련 법령을 위반하는 행위</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제4조 (서비스 변경 및 중단)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
          서비스 변경 또는 중단 시 사전 공지를 원칙으로 하나, 불가피한 경우 사후 공지할 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제5조 (면책 조항)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스에서 제공하는 자격증 정보는 공공데이터(한국산업인력공단 큐넷)를 기반으로 하며,
          시험 일정, 합격률 등의 정보는 변경될 수 있습니다. 중요한 사항은 반드시 공식 기관에서 확인하시기 바랍니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제6조 (문의)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스 이용 관련 문의사항은 아래 이메일로 연락해 주세요.
        </p>
        <p className="mt-2 text-foreground font-medium">이메일: contact@i-ve.ai</p>
      </section>
    </div>
  )
}
```

### Step 4: 테스트 통과 확인

Run: `cd frontend && npx playwright test tests/e2e/terms.spec.ts --reporter=line`
Expected: 3개 테스트 모두 PASS

### Step 5: Commit

```bash
git add frontend/src/app/terms/page.tsx frontend/tests/e2e/terms.spec.ts
git commit -m "feat: add terms of service page with SEO metadata"
```

---

## Task 3: 개인정보 처리방침 페이지 생성 (/privacy)

**Files:**
- Create: `frontend/src/app/privacy/page.tsx`

### Step 1: 테스트 작성

`frontend/tests/e2e/privacy.spec.ts` 신규 생성:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Privacy Page', () => {
  test('should render privacy page', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveTitle(/개인정보.*자격증 마스터/)
  })

  test('should have main heading', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: '개인정보 처리방침' })).toBeVisible()
  })

  test('should mention Google OAuth', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByText('Google')).toBeVisible()
  })
})
```

### Step 2: 테스트 실패 확인

Run: `cd frontend && npx playwright test tests/e2e/privacy.spec.ts --reporter=line`
Expected: FAIL — 페이지 없어서 404

### Step 3: privacy 페이지 구현

`frontend/src/app/privacy/page.tsx` 생성:

```typescript
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '자격증 마스터의 개인정보 처리방침입니다. 수집하는 정보와 이용 목적을 안내합니다.',
  openGraph: {
    title: '개인정보 처리방침 | 자격증 마스터',
    description: '자격증 마스터의 개인정보 처리방침입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/privacy`,
  },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">개인정보 처리방침</h1>
      <p className="text-sm text-muted-foreground mb-8">
        최종 수정일: 2026년 2월 19일
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. 수집하는 개인정보</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          자격증 마스터는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>Google OAuth 로그인을 통해 수집되는 이메일 주소, 프로필 이미지</li>
          <li>서비스 이용 기록 (학습 계획, 체크인 내역)</li>
          <li>접속 로그 (IP 주소, 브라우저 정보 — Google Analytics 수집)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. 개인정보 이용 목적</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>회원 식별 및 서비스 제공</li>
          <li>맞춤형 학습 계획 생성 및 관리</li>
          <li>서비스 개선을 위한 통계 분석 (Google Analytics 4 활용)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. 제3자 서비스</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          서비스는 다음 제3자 서비스를 이용합니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>
            <strong>Google OAuth</strong> — 로그인 인증.
            <a href="https://policies.google.com/privacy" className="text-primary underline ml-1" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a>
          </li>
          <li>
            <strong>Google Analytics 4</strong> — 방문자 통계 분석.
            <a href="https://policies.google.com/technologies/partner-sites" className="text-primary underline ml-1" target="_blank" rel="noopener noreferrer">Google의 데이터 이용방침</a>
          </li>
          <li>
            <strong>Supabase</strong> — 사용자 인증 및 데이터 저장.
            <a href="https://supabase.com/privacy" className="text-primary underline ml-1" target="_blank" rel="noopener noreferrer">Supabase 개인정보처리방침</a>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. 개인정보 보유 기간</h2>
        <p className="text-muted-foreground leading-relaxed">
          회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보유합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. 개인정보 삭제 요청</h2>
        <p className="text-muted-foreground leading-relaxed">
          개인정보 삭제 및 열람을 요청하시려면 아래 이메일로 문의해 주세요.
        </p>
        <p className="mt-2 text-foreground font-medium">이메일: contact@i-ve.ai</p>
      </section>
    </div>
  )
}
```

### Step 4: 테스트 통과 확인

Run: `cd frontend && npx playwright test tests/e2e/privacy.spec.ts --reporter=line`
Expected: 3개 테스트 모두 PASS

### Step 5: Commit

```bash
git add frontend/src/app/privacy/page.tsx frontend/tests/e2e/privacy.spec.ts
git commit -m "feat: add privacy policy page with SEO metadata"
```

---

## Task 4: About 페이지 생성 (/about)

**Files:**
- Create: `frontend/src/app/about/page.tsx`

### Step 1: 테스트 작성

`frontend/tests/e2e/about.spec.ts` 신규 생성:

```typescript
import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test('should render about page', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/자격증 마스터 소개.*자격증 마스터/)
  })

  test('should have main heading', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should mention key features', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('AI')).toBeVisible()
  })

  test('should have link to main page', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('link', { name: /자격증 검색|시작하기/ })).toBeVisible()
  })
})
```

### Step 2: 테스트 실패 확인

Run: `cd frontend && npx playwright test tests/e2e/about.spec.ts --reporter=line`
Expected: FAIL — 페이지 없어서 404

### Step 3: about 페이지 구현

`frontend/src/app/about/page.tsx` 생성:

```typescript
import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Brain, BarChart3, BookOpen } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '자격증 마스터 소개',
  description: '자격증 마스터는 600개 이상의 국가자격증 정보를 제공하고, AI가 나에게 맞는 자격증을 추천해주는 학습 플랫폼입니다.',
  keywords: [
    '자격증 마스터',
    '자격증 플랫폼',
    'AI 자격증 추천',
    '자격증 학습 계획',
    '국가자격증 정보',
  ],
  openGraph: {
    title: '자격증 마스터 소개 | 자격증 검색 및 AI 추천 플랫폼',
    description: '600개 이상의 국가자격증 정보와 AI 맞춤 추천, 학습 계획 자동 생성을 제공하는 자격증 마스터를 소개합니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: '자격증 마스터' }],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const features = [
  {
    icon: Search,
    title: '600+ 자격증 검색',
    description: '한국산업인력공단 큐넷 공공데이터 기반, 국가기술자격부터 전문자격까지 600개 이상의 자격증 정보를 한눈에 비교하세요.',
  },
  {
    icon: Brain,
    title: 'AI 맞춤 추천',
    description: '분야, 목표, 경험 수준, 학습 가능 시간을 입력하면 AI가 나에게 딱 맞는 자격증을 추천해 드립니다.',
  },
  {
    icon: BookOpen,
    title: '학습 계획 자동 생성',
    description: '목표 날짜와 하루 학습 시간을 설정하면, AI가 주차별 학습 마일스톤을 자동으로 생성합니다.',
  },
  {
    icon: BarChart3,
    title: '진행도 추적',
    description: '매일 체크인으로 학습 기록을 남기고, 목표 달성까지 남은 일수와 진행률을 시각적으로 확인하세요.',
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">자격증 마스터</span>란?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          자격증 준비생들이 산재된 정보를 일일이 찾는 불편함을 해소하기 위해 만들었습니다.
          자격증 검색, AI 추천, 학습 계획, 진행도 추적을 한 곳에서 제공합니다.
        </p>
      </div>

      {/* 핵심 기능 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">핵심 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 데이터 출처 */}
      <section className="mb-16 p-6 rounded-xl border border-border bg-muted/30">
        <h2 className="text-xl font-bold mb-4">데이터 출처</h2>
        <p className="text-muted-foreground leading-relaxed">
          자격증 마스터의 자격증 정보는{' '}
          <a
            href="https://www.q-net.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            한국산업인력공단 큐넷(Q-Net)
          </a>
          의 공공데이터를 기반으로 합니다.
          시험 일정, 합격률 등 세부 정보는 변경될 수 있으니 중요한 사항은 반드시 큐넷 공식 사이트에서 확인해 주세요.
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          자격증 검색 시작하기
        </Link>
      </div>
    </div>
  )
}
```

### Step 4: 테스트 통과 확인

Run: `cd frontend && npx playwright test tests/e2e/about.spec.ts --reporter=line`
Expected: 4개 테스트 모두 PASS

### Step 5: Commit

```bash
git add frontend/src/app/about/page.tsx frontend/tests/e2e/about.spec.ts
git commit -m "feat: add about page for brand SEO"
```

---

## Task 5: 빌드 전체 검증

**Files:**
- No changes — 빌드 검증만 수행

### Step 1: 전체 빌드 확인

Run: `cd frontend && npm run build`
Expected: 빌드 성공. 다음 페이지들이 정적 생성에 포함되어야 함:
- `/terms`
- `/privacy`
- `/about`

출력 예시:
```
Route (app)                Size     First Load JS
├ ○ /                      ...
├ ○ /about                 ...
├ ○ /terms                 ...
├ ○ /privacy               ...
```

### Step 2: Commit

```bash
git add .
git commit -m "chore: verify SEO pages build successfully"
```

---

## Task 6: Google Search Console 등록 (환경변수 연동)

> 이 Task는 코드 작업과 외부 서비스 등록을 병행합니다.

**Files:**
- Modify: `deploy/.env.production` (또는 서버의 `.env.production`)

### Step 1: Google Search Console 접속 및 사이트 등록

1. https://search.google.com/search-console 접속 (Google 계정 로그인)
2. 왼쪽 상단 속성 추가 → "URL 접두어" 선택
3. `https://cert.i-ve.ai` 입력 → 계속

### Step 2: 소유권 확인 코드 복사

1. 확인 방법 중 **"HTML 태그"** 선택
2. 아래와 같은 메타태그가 표시됨:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXX" />
   ```
3. `content` 값(영문+숫자)을 복사

### Step 3: 환경변수 설정

서버의 `.env.production` 파일에 추가:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=복사한값_여기에_입력
```

`layout.tsx`에 이미 아래 코드가 있으므로 env만 설정하면 자동 적용됨:
```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  ...
}
```

### Step 4: 배포 후 소유권 확인

1. `cd deploy && docker-compose up -d --build` 로 배포
2. Search Console 에서 "확인" 버튼 클릭
3. "소유권이 확인되었습니다" 메시지 확인

### Step 5: Sitemap 제출

1. Search Console 좌측 메뉴 → "Sitemaps"
2. "새 사이트맵 추가"에 `sitemap.xml` 입력 → 제출
3. "성공" 상태 확인 (수 분 내)

---

## Task 7: Naver Search Advisor 등록 (환경변수 연동)

**Files:**
- Modify: `deploy/.env.production`

### Step 1: 네이버 서치어드바이저 접속

1. https://searchadvisor.naver.com 접속 (네이버 계정 로그인)
2. "웹마스터 도구" → "사이트 추가"
3. `https://cert.i-ve.ai` 입력 → 확인

### Step 2: 소유권 확인 코드 복사

1. **"HTML 태그 추가"** 방식 선택
2. 아래와 같은 메타태그 표시됨:
   ```html
   <meta name="naver-site-verification" content="XXXXXXXXXXXXX" />
   ```
3. `content` 값 복사

### Step 3: 환경변수 설정

서버의 `.env.production`에 추가:

```env
NEXT_PUBLIC_NAVER_SITE_VERIFICATION=복사한값_여기에_입력
```

`layout.tsx`에 이미 아래 코드가 있으므로 env만 설정하면 자동 적용됨:
```typescript
verification: {
  other: {
    'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
  },
},
```

### Step 4: 배포 후 소유권 확인

1. 배포 완료 후 서치어드바이저에서 "소유 확인" 클릭
2. 성공 메시지 확인

### Step 5: 사이트맵 제출

1. 서치어드바이저 → 해당 사이트 → "요청" → "사이트맵 제출"
2. `https://cert.i-ve.ai/sitemap.xml` 입력 → 확인

---

## Task 8: Organization JSON-LD 이메일 실제값 교체

**Files:**
- Modify: `frontend/src/components/seo/json-ld.tsx:41`

### Step 1: 현재 값 확인

`frontend/src/components/seo/json-ld.tsx` 의 Organization 케이스에서:
```typescript
email: 'contact@certmaster.kr',
```

이 이메일은 존재하지 않는 주소임. 실제 운영 이메일로 교체 필요.

### Step 2: 실제 이메일로 교체

```typescript
email: 'contact@i-ve.ai',
```

### Step 3: 빌드 확인

Run: `cd frontend && npm run build`
Expected: 빌드 성공

### Step 4: Commit

```bash
git add frontend/src/components/seo/json-ld.tsx
git commit -m "fix: update Organization JSON-LD contact email to correct address"
```

---

## 완료 후 검증 체크리스트

```
□ site:cert.i-ve.ai 구글 검색 → 페이지 노출 시작 (배포 후 최소 1-2주 소요)
□ Google Search Console → Sitemap에 "처리된 URL" 수 표시됨
□ Naver Search Advisor → 사이트 정상 등록 확인
□ /terms 페이지 접속 → 404 아닌 정상 렌더링
□ /privacy 페이지 접속 → 404 아닌 정상 렌더링
□ /about 페이지 접속 → 404 아닌 정상 렌더링
□ curl https://cert.i-ve.ai/sitemap.xml → /community 없음 확인
□ "자격증 마스터" 구글 검색 → 2-4주 후 1위 노출 목표
```

---

## Task 순서 의존성

```
Task 1 (sitemap 정리) ─ 독립
Task 2 (terms)        ─ 독립
Task 3 (privacy)      ─ 독립
Task 4 (about)        ─ 독립
Task 5 (빌드 검증)    ─ Task 1, 2, 3, 4 완료 후
Task 6 (Google SC)    ─ Task 5 완료 후 (배포 필요)
Task 7 (Naver SA)     ─ Task 5 완료 후 (배포 필요)
Task 8 (JSON-LD)      ─ 독립
```
