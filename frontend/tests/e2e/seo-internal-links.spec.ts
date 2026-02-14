import { test, expect } from '@playwright/test'

test.describe('SEO - 홈페이지 SSR 내부 링크', () => {
  test('홈페이지 HTML에 자격증 상세 페이지 링크가 SSR로 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // /certificates/ 링크가 SSR HTML에 포함되어야 함
    const certLinkPattern = /href="\/certificates\/[a-f0-9-]+"/g
    const matches = html.match(certLinkPattern) || []

    // 최소 10개 이상의 자격증 링크가 있어야 함
    expect(matches.length).toBeGreaterThanOrEqual(10)
  })

  test('SSR 자격증 링크 섹션에 heading이 있어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // 인기 자격증 또는 전체 자격증 관련 heading이 있어야 함
    expect(html).toMatch(/인기 자격증|전체 자격증|자격증 목록/)
  })

  test('SSR 자격증 링크에 자격증 이름 텍스트가 포함되어야 함', async ({ page }) => {
    await page.goto('/')

    // SSR로 렌더링된 자격증 링크 섹션이 있어야 함
    const certLinksSection = page.locator('[data-testid="ssr-certificate-links"]')
    await expect(certLinksSection).toBeVisible()

    // 자격증 링크가 최소 10개 이상
    const links = certLinksSection.locator('a[href*="/certificates/"]')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(10)
  })
})
