import { test, expect } from '@playwright/test'

test.describe('Landing Page - Trust Elements Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display trust section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /많은 분들이/i })).toBeVisible()
  })

  test('should display 3 use case cards', async ({ page }) => {
    const useCases = page.locator('[data-testid="use-case-card"]')
    await expect(useCases).toHaveCount(3)
  })

  test('should show user personas and stories', async ({ page }) => {
    await expect(page.getByText(/직장인 김OO님/i)).toBeVisible()
    await expect(page.getByText(/대학생 이OO님/i)).toBeVisible()
    await expect(page.getByText(/취준생 박OO님/i)).toBeVisible()
  })

  test('should display popular certificates inside trust section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /실제로 많이 준비하는 자격증/i })).toBeVisible()
  })

  test('should display 4 trust badges', async ({ page }) => {
    const badges = page.locator('[data-testid="trust-badge"]')
    await expect(badges).toHaveCount(4)
  })

  test('should be responsive grid layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const useCases = page.locator('[data-testid="use-case-card"]')
    await expect(useCases.first()).toBeVisible()
  })
})
