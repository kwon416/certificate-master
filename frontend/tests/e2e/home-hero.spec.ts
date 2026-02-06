import { test, expect } from '@playwright/test'

test.describe('Home Page Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display hero section with headline and subtitle', async ({ page }) => {
    // Hero section should exist
    const hero = page.locator('[data-testid="home-hero"]')
    await expect(hero).toBeVisible()

    // Main headline with gradient text
    const heading = hero.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('자격증')

    // Subtitle description
    await expect(
      hero.getByText(/600개 이상/)
    ).toBeVisible()
  })

  test('should have search bar inside the hero section', async ({ page }) => {
    const hero = page.locator('[data-testid="home-hero"]')

    // Search input should be inside hero
    const searchInput = hero.getByPlaceholder(/자격증/)
    await expect(searchInput).toBeVisible()
  })

  test('should have quick action links in hero', async ({ page }) => {
    const hero = page.locator('[data-testid="home-hero"]')

    // AI recommend link
    await expect(
      hero.getByRole('link', { name: /AI 추천/ })
    ).toBeVisible()
  })

  test('should display trust stats in hero', async ({ page }) => {
    const hero = page.locator('[data-testid="home-hero"]')

    // Should show trust stats
    await expect(hero.getByText('600+')).toBeVisible()
    await expect(hero.getByText(/공공데이터/)).toBeVisible()
    await expect(hero.getByText(/맞춤 추천/)).toBeVisible()
  })

  test('hero should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(300)

    const hero = page.locator('[data-testid="home-hero"]')
    await expect(hero).toBeVisible()

    // Headline should still be visible
    await expect(
      hero.getByRole('heading', { level: 1 })
    ).toBeVisible()

    // Search input should still be visible
    await expect(
      hero.getByPlaceholder(/자격증/)
    ).toBeVisible()
  })
})
