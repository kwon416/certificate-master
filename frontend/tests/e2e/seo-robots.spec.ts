import { test, expect } from '@playwright/test'

test.describe('robots.txt SEO', () => {
  let robotsText: string

  test.beforeAll(async ({ request }) => {
    const response = await request.get('/robots.txt')
    robotsText = await response.text()
  })

  test('should return valid robots.txt', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
  })

  test('should disallow private paths for all user-agents', async () => {
    const privatePaths = ['/api/', '/auth/', '/dashboard', '/study-plans', '/analytics']

    for (const path of privatePaths) {
      expect(robotsText).toContain(`Disallow: ${path}`)
    }
  })

  test('should NOT have bot-specific sections that override wildcard Disallow', async () => {
    // robots.txt spec: bot-specific blocks are independent.
    // If Googlebot section only has Allow: /, it ignores wildcard Disallows.
    // Fix: either remove bot sections or add same Disallow rules to each.

    const botSections = ['Googlebot', 'Yeti', 'Bingbot']

    for (const bot of botSections) {
      const botRegex = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?(?=User-agent:|$)`, 'i')
      const match = robotsText.match(botRegex)

      if (match) {
        // If a bot-specific section exists, it should include Disallow rules
        // OR it should not exist (relying on wildcard)
        const section = match[0]
        const hasDisallow = section.includes('Disallow: /api/')
          || !section.includes('Allow:') // Empty section is fine too

        expect(
          hasDisallow,
          `${bot} section should include Disallow rules or not override wildcard`
        ).toBe(true)
      }
    }
  })

  test('should disallow login and signup pages', async () => {
    expect(robotsText).toContain('Disallow: /login')
    expect(robotsText).toContain('Disallow: /signup')
  })

  test('should reference sitemap', async () => {
    expect(robotsText).toContain('Sitemap:')
    expect(robotsText).toContain('sitemap.xml')
  })
})

test.describe('미구현 페이지 noindex', () => {
  test('/community 페이지는 noindex 처리되어야 함', async ({ request }) => {
    const response = await request.get('/community')
    const html = await response.text()

    // 미구현("준비 중") 페이지는 검색엔진에 인덱싱되면 안 됨
    const hasNoindex = html.includes('noindex')
    expect(hasNoindex, '/community 페이지에 noindex 메타 태그가 없음').toBe(true)
  })
})
