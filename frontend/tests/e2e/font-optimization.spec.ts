import { test, expect } from '@playwright/test'

test.describe('Font Loading Optimization', () => {
  test('globals.css에 render-blocking @import가 없어야 한다', async ({ page }) => {
    await page.goto('/')

    // globals.css 내에 @import url()이 없는지 확인
    // next/font/google이 Outfit을 셀프호스팅하므로 @import 불필요
    const stylesheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets)
      const importRules: string[] = []
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || [])
          for (const rule of rules) {
            if (rule instanceof CSSImportRule) {
              importRules.push(rule.href)
            }
          }
        } catch {
          // Cross-origin stylesheets will throw
        }
      }
      return importRules
    })

    // Google Fonts @import가 없어야 함 (next/font/google이 대체)
    const googleFontImports = stylesheets.filter(url =>
      url.includes('fonts.googleapis.com')
    )
    expect(googleFontImports).toHaveLength(0)
  })

  test('Outfit 폰트가 next/font를 통해 CSS 변수로 적용되어야 한다', async ({ page }) => {
    await page.goto('/')

    // next/font/google은 --font-outfit CSS 변수를 html/body에 주입
    const hasOutfitVariable = await page.evaluate(() => {
      // next/font는 className에 CSS 변수를 포함하는 고유 클래스를 추가
      const html = document.documentElement
      const body = document.body
      const allClasses = html.className + ' ' + body.className
      return allClasses.includes('__variable')
    })
    expect(hasOutfitVariable).toBe(true)

    // Google Fonts CDN에서 Outfit을 직접 로드하지 않아야 함
    const googleFontLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
      return links.length
    })
    expect(googleFontLinks).toBe(0)
  })

  test('Pretendard 폰트가 link 태그로 로드되어야 한다 (@import가 아님)', async ({ page }) => {
    await page.goto('/')

    // Pretendard CSS가 link 태그로 로드되는지 확인
    const pretendardLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      return links.some(link =>
        (link as HTMLLinkElement).href.includes('pretendard')
      )
    })
    expect(pretendardLink).toBe(true)
  })

  test('font-family가 올바르게 적용되어야 한다', async ({ page }) => {
    await page.goto('/')

    const bodyFontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily
    })

    // Outfit 또는 Pretendard가 font-family에 포함되어야 함
    expect(bodyFontFamily).toMatch(/Outfit|Pretendard|sans-serif/i)
  })

  test('Google Fonts CDN으로의 불필요한 preconnect가 없어야 한다', async ({ page }) => {
    await page.goto('/')

    // next/font/google이 셀프호스팅하므로 Google Fonts preconnect 불필요
    const googlePreconnects = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="preconnect"]'))
      return links.filter(link =>
        (link as HTMLLinkElement).href.includes('fonts.googleapis.com') ||
        (link as HTMLLinkElement).href.includes('fonts.gstatic.com')
      ).map(link => (link as HTMLLinkElement).href)
    })

    expect(googlePreconnects).toHaveLength(0)
  })
})
