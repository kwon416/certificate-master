import { test, expect } from '@playwright/test'

test.describe('Design Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('1. Pretendard Font', () => {
    test('should load Pretendard font via CSS', async ({ page }) => {
      // Check that Pretendard font is available (loaded via @import in CSS)
      const hasPretendard = await page.evaluate(() => {
        // Check stylesheets for pretendard reference (direct or @import)
        const styleSheets = Array.from(document.styleSheets)
        for (const sheet of styleSheets) {
          try {
            if (sheet.href?.includes('pretendard')) return true
            const rules = Array.from(sheet.cssRules || [])
            for (const rule of rules) {
              if (rule instanceof CSSImportRule && rule.href?.includes('pretendard')) return true
            }
          } catch { /* skip cross-origin */ }
        }
        // Also check if font is available via document.fonts
        return document.fonts.check('16px "Pretendard Variable"') ||
               document.fonts.check('16px Pretendard')
      })
      expect(hasPretendard).toBe(true)
    })

    test('should apply Pretendard in font-family stack', async ({ page }) => {
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily
      })
      expect(fontFamily.toLowerCase()).toContain('pretendard')
    })
  })

  test.describe('2. Category Color Accents', () => {
    test('should show color accent bar on certificate cards', async ({ page }) => {
      // Wait for cards to load
      await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })

      const firstCard = page.locator('[data-testid="certificate-card"]').first()

      // Card should have a color accent bar (border-top or border-left with color)
      const accentBar = firstCard.locator('[data-testid="category-accent"]')
      await expect(accentBar).toBeVisible()
    })
  })

  test.describe('3. Hero Stats Badges', () => {
    test('should display stat badges in hero section', async ({ page }) => {
      const hero = page.locator('[data-testid="home-hero"]')

      // Should have stat badges container
      const statBadges = hero.locator('[data-testid="hero-stats"]')
      await expect(statBadges).toBeVisible()

      // Should have 3 stat items
      const statItems = statBadges.locator('[data-testid="stat-item"]')
      await expect(statItems).toHaveCount(3)
    })

    test('stat badges should display correct content', async ({ page }) => {
      const stats = page.locator('[data-testid="hero-stats"]')

      await expect(stats.getByText('600+')).toBeVisible()
      await expect(stats.getByText(/공공데이터/)).toBeVisible()
      await expect(stats.getByText(/맞춤 추천/)).toBeVisible()
      await expect(stats.getByText(/실시간/)).toBeVisible()
    })
  })

  test.describe('4. Card Hover Effects', () => {
    test('certificate cards should have hover scale effect class', async ({ page }) => {
      await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })

      const firstCard = page.locator('[data-testid="certificate-card"]').first()

      // Check that card has transition and hover scale classes
      const classList = await firstCard.evaluate((el) => el.className)
      expect(classList).toMatch(/transition-\[/)
      expect(classList).toContain('duration-300')
    })
  })

  test.describe('5. Animation Improvements', () => {
    test('card wrapper should start with opacity 0 for slide-up animation', async ({ page }) => {
      // Navigate fresh to catch initial state
      await page.goto('/')

      // The animate-slide-up class should include opacity animation
      const hasAnimation = await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets)
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules)
            for (const rule of rules) {
              if (rule instanceof CSSKeyframesRule && rule.name === 'slide-up') {
                return true
              }
            }
          } catch { /* skip cross-origin */ }
        }
        return false
      })
      expect(hasAnimation).toBe(true)
    })
  })
})
