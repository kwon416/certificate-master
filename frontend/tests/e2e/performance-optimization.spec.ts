import { test, expect } from '@playwright/test'

test.describe('Performance Optimization', () => {
  test.describe('Forced Reflow Prevention', () => {
    test('body::before에 GPU 비용이 높은 SVG feTurbulence 필터가 없어야 한다', async ({ page }) => {
      await page.goto('/')

      const hasExpensivePseudo = await page.evaluate(() => {
        const beforeStyle = window.getComputedStyle(document.body, '::before')
        const bgImage = beforeStyle.backgroundImage || ''
        // feTurbulence SVG 필터는 GPU 비용이 높음
        return bgImage.includes('feTurbulence')
      })

      expect(hasExpensivePseudo).toBe(false)
    })

    test('body::before에 z-index: 9999 fixed 오버레이가 없어야 한다', async ({ page }) => {
      await page.goto('/')

      const hasFixedOverlay = await page.evaluate(() => {
        const beforeStyle = window.getComputedStyle(document.body, '::before')
        const position = beforeStyle.position
        const zIndex = beforeStyle.zIndex
        // fixed + 높은 z-index는 렌더링 성능에 악영향
        return position === 'fixed' && parseInt(zIndex) > 9000
      })

      expect(hasFixedOverlay).toBe(false)
    })
  })

  test.describe('Font Loading Chain', () => {
    test('Pretendard CSS가 preload로 우선 로딩되어야 한다', async ({ page }) => {
      await page.goto('/')

      const hasPreload = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="preload"][as="style"]'))
        return links.some(link =>
          (link as HTMLLinkElement).href.includes('pretendard')
        )
      })

      expect(hasPreload).toBe(true)
    })
  })
})
