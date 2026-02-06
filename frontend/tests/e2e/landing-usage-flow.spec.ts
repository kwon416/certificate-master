import { test, expect } from '@playwright/test'

test.describe('Landing Page - Usage Flow Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
  })

  test('should display usage flow section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /복잡한 선택을 단순하게/i })).toBeVisible()
  })

  test('should display 3 usage steps', async ({ page }) => {
    const steps = page.locator('[data-testid="usage-step"]')
    await expect(steps).toHaveCount(3)
  })

  test('should show step numbers in order', async ({ page }) => {
    await expect(page.getByText(/1.*관심 분야/i)).toBeVisible()
    await expect(page.getByText(/2.*추천 자격증/i)).toBeVisible()
    await expect(page.getByText(/3.*준비 일정/i)).toBeVisible()
  })

  test('should display time estimates', async ({ page }) => {
    await expect(page.getByText(/10초 소요/i)).toBeVisible()
    await expect(page.getByText(/30초 소요/i)).toBeVisible()
    await expect(page.getByText(/1분 소요/i)).toBeVisible()
  })

  test('should have connecting line on desktop', async ({ page }) => {
    const line = page.locator('[data-testid="connecting-line"]')
    await expect(line).toBeVisible()
  })

  test('should be horizontal layout on desktop', async ({ page }) => {
    const grid = page.locator('div:has([data-testid="usage-step"])').first()
    await expect(grid).toBeVisible()
  })

  test('should stack vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const steps = page.locator('[data-testid="usage-step"]')
    await expect(steps.first()).toBeVisible()
  })
})
