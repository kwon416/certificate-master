import { test, expect } from '@playwright/test'

test.describe('Landing Page - Solution Limitations Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
  })

  test('should display limitations section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /기존 방법들은 왜 불편할까요/i })).toBeVisible()
  })

  test('should display 3 limitation cards', async ({ page }) => {
    const limitCards = page.locator('[data-testid="limitation-card"]')
    await expect(limitCards).toHaveCount(3)
  })

  test('should show limitation method names', async ({ page }) => {
    await expect(page.getByText(/블로그·카페 정보/i)).toBeVisible()
    await expect(page.getByText(/자격증 공식 사이트/i)).toBeVisible()
    await expect(page.getByText(/직접 정리하기/i)).toBeVisible()
  })

  test('should display issues list for each method', async ({ page }) => {
    await expect(page.getByText(/주관적이고 오래된/i)).toBeVisible()
    await expect(page.getByText(/비교 기준이 제각각/i)).toBeVisible()
    await expect(page.getByText(/많은 시간이 필요/i)).toBeVisible()
  })
})
