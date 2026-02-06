import { test, expect } from '@playwright/test'

test.describe('Landing Page - Problem Empathy Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
  })

  test('should display problem empathy section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /혹시 이런 고민/i })).toBeVisible()
  })

  test('should display 4 problem cards', async ({ page }) => {
    const problemCards = page.locator('[data-testid="problem-card"]')
    await expect(problemCards).toHaveCount(4)
  })

  test('should show problem text with icons', async ({ page }) => {
    await expect(page.getByText(/자격증이 너무 많아서 뭘 골라야 할지/i)).toBeVisible()
    await expect(page.getByText(/검색할수록 정보가 제각각/i)).toBeVisible()
    await expect(page.getByText(/지금 따도 의미가 있을지 확신이/i)).toBeVisible()
    await expect(page.getByText(/공식 일정 정보를 찾기 어려워요/i)).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const problemCards = page.locator('[data-testid="problem-card"]')
    await expect(problemCards.first()).toBeVisible()
  })

  test('should have appropriate spacing between cards', async ({ page }) => {
    const section = page.locator('section:has-text("혹시 이런 고민")')
    await expect(section).toBeVisible()
  })

  test('should display closing statement', async ({ page }) => {
    await expect(page.getByText(/이 중 하나라도 공감되면/i)).toBeVisible()
  })
})
