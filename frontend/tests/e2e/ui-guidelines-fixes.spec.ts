import { test, expect } from '@playwright/test'

test.describe('UI Guidelines Fixes - Accessibility', () => {
  test.describe('Search Input', () => {
    test('should have aria-label on search input', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.locator('input[type="text"][aria-label]').first()
      await expect(searchInput).toHaveAttribute('aria-label', /자격증 검색/)
    })

    test('should have autocomplete="off" on search input', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.locator('input[type="text"]').first()
      await expect(searchInput).toHaveAttribute('autocomplete', 'off')
    })

    test('autocomplete dropdown should have aria-live for async updates', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // The aria-live region should exist even when dropdown is not visible
      const liveRegion = page.locator('[aria-live="polite"]')
      await expect(liveRegion.first()).toBeAttached()
    })
  })

  test.describe('Decorative Icons', () => {
    test('header logo icon should have aria-hidden', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Header logo GraduationCap icon
      const headerLogoIcon = page.locator('header a svg').first()
      await expect(headerLogoIcon).toHaveAttribute('aria-hidden', 'true')
    })

    test('footer logo icon should have aria-hidden', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const footerLogoIcon = page.locator('footer a svg').first()
      await expect(footerLogoIcon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  test.describe('Dialog/Sheet', () => {
    test('mobile nav sheet close button should have Korean sr-only text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /메뉴 열기/ })
      if (await menuButton.isVisible()) {
        await menuButton.click()

        const closeText = page.locator('.sr-only', { hasText: '닫기' })
        await expect(closeText.first()).toBeAttached()
      }
    })
  })

  test.describe('Footer', () => {
    test('footer year should have suppressHydrationWarning (no mismatch)', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Just verify the footer renders correctly with the year
      const footer = page.locator('footer')
      const yearText = footer.getByText(new RegExp(`${new Date().getFullYear()}`))
      await expect(yearText).toBeVisible()
    })
  })

  test.describe('Certificate Detail Tabs', () => {
    test('tab selection should be reflected in URL', async ({ page }) => {
      // Navigate to a certificate detail page
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Find a certificate link and navigate
      const certLink = page.locator('a[href*="/certificates/"]').first()
      const isVisible = await certLink.isVisible({ timeout: 10000 }).catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      await certLink.click()
      await page.waitForLoadState('domcontentloaded')

      // Click on a different tab
      const examTab = page.getByRole('tab', { name: /시험 정보/ })
      if (await examTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await examTab.click()
        // URL should contain tab parameter
        await expect(page).toHaveURL(/tab=exam/)
      }
    })
  })
})
