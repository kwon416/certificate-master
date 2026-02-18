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
