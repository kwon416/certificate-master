import { test, expect } from '@playwright/test'

test.describe('Privacy Page', () => {
  test('should render privacy page', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveTitle(/개인정보.*자격증 마스터/)
  })

  test('should have main heading', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: '개인정보 처리방침' })).toBeVisible()
  })

  test('should mention Google OAuth', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByText('Google OAuth', { exact: true })).toBeVisible()
  })
})
