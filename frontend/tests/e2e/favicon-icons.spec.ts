import { test, expect } from '@playwright/test'

test.describe('Favicon and App Icons', () => {
  test('should have favicon.ico link in head', async ({ page }) => {
    await page.goto('/')
    // Next.js App Router auto-generates favicon link from app/favicon.ico
    const favicon = page.locator('link[rel="icon"][href*="favicon.ico"]')
    await expect(favicon.first()).toBeAttached()
  })

  test('should have multiple icon sizes for different devices', async ({ page }) => {
    await page.goto('/')
    // Check that icon links with various sizes exist
    const icon16 = page.locator('link[rel="icon"][type="image/png"][sizes="16x16"]')
    await expect(icon16).toBeAttached()
    const icon32 = page.locator('link[rel="icon"][type="image/png"][sizes="32x32"]')
    await expect(icon32).toBeAttached()
    const icon96 = page.locator('link[rel="icon"][type="image/png"][sizes="96x96"]')
    await expect(icon96).toBeAttached()
  })

  test('should have apple-touch-icon links', async ({ page }) => {
    await page.goto('/')
    const appleIcons = page.locator('link[rel="apple-touch-icon"]')
    // Should have multiple apple-touch-icon sizes (57, 60, 72, 76, 114, 120, 144, 152, 180)
    await expect(appleIcons).toHaveCount(9)
  })

  test('should have web app manifest', async ({ page }) => {
    await page.goto('/')
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toBeAttached()
  })

  test('favicon.ico should be accessible', async ({ request }) => {
    const response = await request.get('/favicon.ico')
    expect(response.status()).toBe(200)
  })

  test('apple-icon-180x180 should be accessible', async ({ request }) => {
    const response = await request.get('/apple-icon-180x180.png')
    expect(response.status()).toBe(200)
  })
})
