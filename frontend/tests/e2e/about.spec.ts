import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test('should render about page', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/자격증 마스터 소개.*자격증 마스터/)
  })

  test('should have main heading', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should mention key features', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { name: 'AI 맞춤 추천' })).toBeVisible()
  })

  test('should have link to main page', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('link', { name: '자격증 검색 시작하기' })).toBeVisible()
  })
})
