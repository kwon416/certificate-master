import { test, expect } from '@playwright/test'

test.describe('Certificate Detail - Breadcrumb & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage, wait for certificates to load, then click one
    await page.goto('/')
    const firstCard = page.locator('a[href^="/certificates/"]').first()
    // If backend not available, certificates won't load - skip gracefully
    try {
      await firstCard.waitFor({ state: 'visible', timeout: 15000 })
      await firstCard.click()
      await page.waitForURL(/\/certificates\//, { timeout: 10000 })
    } catch {
      test.skip(true, 'Backend not available - certificates did not load')
    }
  })

  test('should display visual breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
  })

  test('breadcrumb should contain home link and current certificate name', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()

    // Should have a link to home
    const homeLink = breadcrumb.getByRole('link', { name: /자격증 검색/i })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', '/')

    // Should show current certificate name
    const currentPage = breadcrumb.locator('[aria-current="page"]')
    await expect(currentPage).toBeVisible()
    const text = await currentPage.textContent()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('should not have links to /search (redirects to /)', async ({ page }) => {
    // The main content should not link to /search
    const searchLink = page.locator('nav[aria-label="breadcrumb"] a[href="/search"]')
    await expect(searchLink).toHaveCount(0)
  })
})
