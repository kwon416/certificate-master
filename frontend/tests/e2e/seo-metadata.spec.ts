import { test, expect } from '@playwright/test'

test.describe('SEO Metadata', () => {
  test.describe('Homepage', () => {
    test('should have brand name in title', async ({ page }) => {
      await page.goto('/')
      const title = await page.title()
      expect(title).toContain('자격증 마스터')
    })

    test('should have proper meta description', async ({ page }) => {
      await page.goto('/')
      const description = await page.getAttribute('meta[name="description"]', 'content')
      expect(description).toBeTruthy()
      expect(description!.length).toBeGreaterThan(50)
      expect(description).toContain('자격증')
    })

    test('should have correct canonical URL', async ({ page }) => {
      await page.goto('/')
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
      expect(canonical).toBeTruthy()
      // Homepage canonical should be the root URL (no subpath)
      const url = new URL(canonical!)
      expect(url.pathname).toBe('/')
    })

    test('should have Open Graph tags', async ({ page }) => {
      await page.goto('/')
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content')
      const ogType = await page.getAttribute('meta[property="og:type"]', 'content')

      expect(ogTitle).toContain('자격증 마스터')
      expect(ogDescription).toBeTruthy()
      expect(ogType).toBe('website')
    })
  })

  test.describe('About Page', () => {
    test('should have correct canonical URL for about', async ({ page }) => {
      await page.goto('/about')
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
      expect(canonical).toBeTruthy()
      expect(canonical).toContain('/about')
    })
  })

  test.describe('Recommend Page', () => {
    test('should have page-specific title', async ({ page }) => {
      await page.goto('/recommend')
      const title = await page.title()
      expect(title).toContain('AI')
      expect(title).toContain('자격증 마스터')
    })

    test('should have correct canonical URL for recommend', async ({ page }) => {
      await page.goto('/recommend')
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
      expect(canonical).toContain('/recommend')
    })
  })
})
