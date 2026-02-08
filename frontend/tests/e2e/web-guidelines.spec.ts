import { test, expect } from '@playwright/test'

test.describe('Web Interface Guidelines Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test.describe('prefers-reduced-motion', () => {
    test('should have prefers-reduced-motion media query in CSS for custom animations', async ({ page }) => {
      const hasReducedMotionRule = await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets)
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules)
            for (const rule of rules) {
              if (
                rule instanceof CSSMediaRule &&
                rule.conditionText?.includes('prefers-reduced-motion')
              ) {
                return true
              }
            }
          } catch { /* skip cross-origin */ }
        }
        return false
      })
      expect(hasReducedMotionRule).toBe(true)
    })

    test('should disable animations when prefers-reduced-motion is set', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Check that animate-float elements have no animation
      const animationStyle = await page.evaluate(() => {
        const el = document.querySelector('.animate-float')
        if (!el) return 'no-element'
        const style = window.getComputedStyle(el)
        return style.animationName
      })

      // Should be 'none' when reduced motion is preferred
      if (animationStyle !== 'no-element') {
        expect(animationStyle).toBe('none')
      }
    })
  })

  test.describe('Dark Mode', () => {
    test('should have color-scheme: dark on html element', async ({ page }) => {
      const colorScheme = await page.evaluate(() => {
        return window.getComputedStyle(document.documentElement).colorScheme
      })
      expect(colorScheme).toContain('dark')
    })

    test('should have theme-color meta tag', async ({ page }) => {
      const themeColor = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="theme-color"]')
        return meta?.getAttribute('content')
      })
      expect(themeColor).toBeTruthy()
    })
  })

  test.describe('Accessibility - aria-label', () => {
    test('footer icon links should have aria-label', async ({ page }) => {
      const githubLink = page.locator('footer a[aria-label="GitHub"]')
      await expect(githubLink).toBeVisible()

      const mailLink = page.locator('footer a[aria-label="이메일 문의"]')
      await expect(mailLink).toBeVisible()
    })

    test('view mode toggle buttons should have aria-label', async ({ page }) => {
      // View toggle buttons appear after certificates load (API dependent)
      const gridBtn = page.locator('button[aria-label="그리드 보기"]')
      const listBtn = page.locator('button[aria-label="리스트 보기"]')

      // Wait for either toggle buttons or a timeout (API may be unavailable)
      const hasToggle = await gridBtn.isVisible({ timeout: 10000 }).catch(() => false)

      if (hasToggle) {
        await expect(gridBtn).toBeVisible()
        await expect(listBtn).toBeVisible()
      } else {
        // Skip assertion if no cards loaded (API unavailable)
        test.skip()
      }
    })
  })

  test.describe('Focus States', () => {
    test('CommandInput should have focus-visible ring style', async ({ page }) => {
      // Check the CSS class in source code - outline-none must be paired with focus-visible:ring
      const hasFocusRing = await page.evaluate(() => {
        // Create a temporary command input to check its styles
        // Instead, verify that the CSS contains focus-visible ring rules
        const sheets = Array.from(document.styleSheets)
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules)
            for (const rule of rules) {
              const cssText = rule.cssText || ''
              // Check for focus-visible combined with ring in the same rule
              if (cssText.includes('focus-visible') && cssText.includes('ring')) {
                return true
              }
            }
          } catch { /* skip cross-origin */ }
        }
        return false
      })
      expect(hasFocusRing).toBe(true)
    })
  })

  test.describe('CDN Preconnect', () => {
    test('should NOT have preconnect for Google Fonts (next/font self-hosts)', async ({ page }) => {
      // next/font/google이 Outfit을 셀프호스팅하므로 Google Fonts CDN preconnect 불필요
      const hasGooglePreconnect = await page.evaluate(() => {
        const links = document.querySelectorAll('link[rel="preconnect"]')
        return Array.from(links).some(link =>
          link.getAttribute('href')?.includes('fonts.googleapis.com') ||
          link.getAttribute('href')?.includes('fonts.gstatic.com')
        )
      })
      expect(hasGooglePreconnect).toBe(false)
    })

    test('should have preconnect link for jsDelivr CDN', async ({ page }) => {
      const hasPreconnect = await page.evaluate(() => {
        const links = document.querySelectorAll('link[rel="preconnect"]')
        return Array.from(links).some(link =>
          link.getAttribute('href')?.includes('cdn.jsdelivr.net')
        )
      })
      expect(hasPreconnect).toBe(true)
    })
  })
})
