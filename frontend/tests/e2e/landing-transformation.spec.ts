import { test, expect } from '@playwright/test'

test.describe('Landing Page - Transformation Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display transformation section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /사용 전후 변화/i })).toBeVisible()
  })

  test('should show before section', async ({ page }) => {
    const beforeSection = page.locator('[data-testid="before-section"]')
    await expect(beforeSection.getByRole('heading', { name: /Before/i })).toBeVisible()
    await expect(page.getByText(/정보 검색만 하다/i)).toBeVisible()
  })

  test('should show after section', async ({ page }) => {
    const afterSection = page.locator('[data-testid="after-section"]')
    await expect(afterSection.getByRole('heading', { name: /After/i })).toBeVisible()
    await expect(page.getByText(/왜 이 자격증을 선택했는지 명확/i)).toBeVisible()
  })

  test('should display transformation arrow', async ({ page }) => {
    const arrow = page.locator('[data-testid="transformation-arrow"]')
    await expect(arrow).toBeVisible()
  })

  test('should display metrics table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: '정보 검색 시간' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '-90%' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '학습 지속 기간' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '+600%' })).toBeVisible()
  })

  test('should use X icons for before items', async ({ page }) => {
    const beforeSection = page.locator('[data-testid="before-section"]')
    await expect(beforeSection).toBeVisible()
  })

  test('should have split layout on desktop', async ({ page }) => {
    const beforeSection = page.locator('[data-testid="before-section"]')
    const afterSection = page.locator('[data-testid="after-section"]')
    await expect(beforeSection).toBeVisible()
    await expect(afterSection).toBeVisible()
  })

  test('should stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const beforeSection = page.locator('[data-testid="before-section"]')
    await expect(beforeSection).toBeVisible()
  })
})
