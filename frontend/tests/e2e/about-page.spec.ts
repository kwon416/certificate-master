/**
 * About Page (/about) E2E Tests
 *
 * Consolidated from:
 * - landing.spec.ts
 * - landing-core-value.spec.ts
 * - landing-limitations.spec.ts
 * - landing-usage-flow.spec.ts
 * - landing-trust-elements.spec.ts
 * - landing-problem-empathy.spec.ts
 */
import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
  })

  // ===== Hero Section =====

  test.describe('Hero Section', () => {
    test('should display the main heading with gradient text', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /자격증/i })).toBeVisible()
      await expect(page.locator('.gradient-text').filter({ hasText: /자격증/i })).toBeVisible()
    })

    test('should have hero section with badge and description', async ({ page }) => {
      await expect(page.getByText(/자격증 비교 정보 플랫폼/i)).toBeVisible()
      await expect(page.getByText(/흩어진 자격증 정보를 한 화면에 모아/i)).toBeVisible()
      await expect(page.getByText(/시험 정보 · 공부 방법 · 후기 기준으로 정리했어요/i)).toBeVisible()
    })

    test('should have CTA buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /자격증 한눈에 보기/i }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: /자격증 공부 시작하기/i })).toBeVisible()
    })

    test('should navigate to home page when clicking hero CTA', async ({ page }) => {
      await page.getByRole('link', { name: /자격증 한눈에 보기/i }).first().click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/')
    })

    test('should navigate to dashboard when clicking secondary CTA', async ({ page }) => {
      await page.getByRole('link', { name: /자격증 공부 시작하기/i }).click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/dashboard')
    })

    test('should display trust indicators', async ({ page }) => {
      await expect(page.getByText(/맞춤형 AI 자격증 추천/i)).toBeVisible()
      await expect(page.getByText(/공공데이터 기반 자격증 정보/i)).toBeVisible()
      await expect(page.getByText(/학습 계획 생성 및 관리/i)).toBeVisible()
    })
  })

  // ===== Problem Empathy Section =====

  test.describe('Problem Empathy Section', () => {
    test('should display problem empathy heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /혹시 이런 고민/i })).toBeVisible()
    })

    test('should display 4 problem cards', async ({ page }) => {
      const problemCards = page.locator('[data-testid="problem-card"]')
      await expect(problemCards).toHaveCount(4)
    })

    test('should show problem text', async ({ page }) => {
      await expect(page.getByText(/자격증이 너무 많아서 뭘 골라야 할지/i)).toBeVisible()
      await expect(page.getByText(/검색할수록 정보가 제각각/i)).toBeVisible()
      await expect(page.getByText(/지금 따도 의미가 있을지 확신이/i)).toBeVisible()
      await expect(page.getByText(/공식 일정 정보를 찾기 어려워요/i)).toBeVisible()
    })

    test('should display closing statement', async ({ page }) => {
      await expect(page.getByText(/이 중 하나라도 공감되면/i)).toBeVisible()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const problemCards = page.locator('[data-testid="problem-card"]')
      await expect(problemCards.first()).toBeVisible()
    })
  })

  // ===== Limitations Section =====

  test.describe('Limitations Section', () => {
    test('should display limitations heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /기존 방법들은 왜 불편할까요/i })).toBeVisible()
    })

    test('should display 3 limitation cards', async ({ page }) => {
      const limitCards = page.locator('[data-testid="limitation-card"]')
      await expect(limitCards).toHaveCount(3)
    })

    test('should show limitation method names and issues', async ({ page }) => {
      await expect(page.getByText(/블로그·카페 정보/i)).toBeVisible()
      await expect(page.getByText(/자격증 공식 사이트/i)).toBeVisible()
      await expect(page.getByText(/직접 정리하기/i)).toBeVisible()
      await expect(page.getByText(/주관적이고 오래된/i)).toBeVisible()
      await expect(page.getByText(/비교 기준이 제각각/i)).toBeVisible()
      await expect(page.getByText(/많은 시간이 필요/i)).toBeVisible()
    })
  })

  // ===== Core Value Section =====

  test.describe('Core Value Section', () => {
    test('should display core value heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Certificate Master는 다릅니다/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: /자격증을 비교 가능한 기준으로 정리했습니다/i })).toBeVisible()
      await expect(page.getByText(/준비 난이도와 활용도를 함께 제공/i)).toBeVisible()
    })

    test('should display 3 value cards with descriptions', async ({ page }) => {
      const valueCards = page.locator('[data-testid="value-card"]')
      await expect(valueCards).toHaveCount(3)
      await expect(page.getByText(/난이도, 준비 기간, 공식 일정 링크를 한눈에 확인/i)).toBeVisible()
      await expect(page.getByText(/이 자격증이 나에게 맞는가 판단 가능/i)).toBeVisible()
      await expect(page.getByText(/목표 날짜 입력 시 자동 계산 및 계획 생성/i)).toBeVisible()
    })

    test('should show proof metrics', async ({ page }) => {
      await expect(page.getByText(/600\+ 자격증/i)).toBeVisible()
      await expect(page.getByText(/10,000\+ 사용자/i)).toBeVisible()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const valueCards = page.locator('[data-testid="value-card"]')
      await expect(valueCards.first()).toBeVisible()
    })
  })

  // ===== Usage Flow Section =====

  test.describe('Usage Flow Section', () => {
    test('should display usage flow heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /복잡한 선택을 단순하게/i })).toBeVisible()
    })

    test('should display 3 usage steps in order', async ({ page }) => {
      const steps = page.locator('[data-testid="usage-step"]')
      await expect(steps).toHaveCount(3)
      await expect(page.getByText(/1.*관심 분야/i)).toBeVisible()
      await expect(page.getByText(/2.*추천 자격증/i)).toBeVisible()
      await expect(page.getByText(/3.*준비 일정/i)).toBeVisible()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const steps = page.locator('[data-testid="usage-step"]')
      await expect(steps.first()).toBeVisible()
    })
  })

  // ===== Trust Elements Section =====

  test.describe('Trust Elements Section', () => {
    test('should display trust section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /많은 분들이/i })).toBeVisible()
    })

    test('should display 3 use case cards with personas', async ({ page }) => {
      const useCases = page.locator('[data-testid="use-case-card"]')
      await expect(useCases).toHaveCount(3)
      await expect(page.getByText(/직장인 김OO님/i)).toBeVisible()
      await expect(page.getByText(/대학생 이OO님/i)).toBeVisible()
      await expect(page.getByText(/취준생 박OO님/i)).toBeVisible()
    })

    test('should display popular certificates heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /실제로 많이 준비하는 자격증/i })).toBeVisible()
    })

    test('should display 4 trust badges', async ({ page }) => {
      const badges = page.locator('[data-testid="trust-badge"]')
      await expect(badges).toHaveCount(4)
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const useCases = page.locator('[data-testid="use-case-card"]')
      await expect(useCases.first()).toBeVisible()
    })
  })

  // ===== Final CTA Section =====

  test.describe('Final CTA Section', () => {
    test('should display final CTA with trust badges', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await expect(page.getByRole('heading', { name: /지금 확인하고 결정하세요/i })).toBeVisible()
      await expect(page.getByText(/자격증 선택, 더 이상 혼자 고민하지 마세요/i)).toBeVisible()
      const finalCtaButton = page.getByRole('link', { name: /자격증 한눈에 보기/i }).last()
      await expect(finalCtaButton).toBeVisible()
    })
  })

  // ===== Page Structure =====

  test.describe('Page Structure', () => {
    test('should have header and footer', async ({ page }) => {
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
    })

    test('should have accessible structure', async ({ page }) => {
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThan(0)
      await expect(page.getByRole('main')).toBeVisible()
    })

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)
      await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /자격증/i })).toBeVisible()
    })
  })
})
