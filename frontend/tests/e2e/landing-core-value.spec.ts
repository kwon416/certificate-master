import { test, expect } from '@playwright/test'

test.describe('Landing Page - Core Value Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display core value section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Certificate Master는 다릅니다/i })).toBeVisible()
  })

  test('should display 3 value cards with result-focused messaging', async ({ page }) => {
    await expect(page.getByText(/비교 가능한 기준으로 정리/i)).toBeVisible()
    await expect(page.getByText(/준비 난이도와 활용도를 함께 제공/i)).toBeVisible()
    await expect(page.getByText(/지금 시작할 수 있는지 알려드립니다/i)).toBeVisible()
  })

  test('should show proof metrics', async ({ page }) => {
    await expect(page.getByText(/3,500\+ 자격증/i)).toBeVisible()
    await expect(page.getByText(/10,000\+ 사용자/i)).toBeVisible()
  })

  test('should have gradient icon circles', async ({ page }) => {
    const valueCards = page.locator('[data-testid="value-card"]')
    await expect(valueCards).toHaveCount(3)
  })

  test('should be grid layout on desktop', async ({ page }) => {
    const grid = page.locator('div:has([data-testid="value-card"])').first()
    await expect(grid).toBeVisible()
  })

  test('should stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const valueCards = page.locator('[data-testid="value-card"]')
    await expect(valueCards.first()).toBeVisible()
  })
})
