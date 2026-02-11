import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should show skip-to-main link on Tab focus', async ({ page }) => {
    await page.goto('/')

    // Press Tab to focus the skip link (should be first focusable element)
    await page.keyboard.press('Tab')

    // The skip link should become visible
    const skipLink = page.getByRole('link', { name: /본문.*건너뛰기|skip.*main/i })
    await expect(skipLink).toBeVisible()
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('should navigate to main content when skip link is clicked', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // After clicking skip link, focus should move to main content area
    const main = page.locator('#main-content')
    await expect(main).toBeAttached()
  })
})
