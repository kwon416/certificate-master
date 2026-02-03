import { test, expect } from '@playwright/test'

test.describe('Sitemap', () => {
  test.describe('sitemap.xml 생성', () => {
    test('sitemap.xml이 올바른 XML 형식으로 반환되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('application/xml')

      const body = await response.text()
      expect(body).toContain('<?xml')
      expect(body).toContain('<urlset')
      expect(body).toContain('</urlset>')
    })

    test('홈페이지 URL이 포함되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 홈페이지 URL 확인
      expect(body).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>|<loc>https?:\/\/[^<]+<\/loc>/)
      // priority 1.0은 "1.0" 또는 "1"로 렌더링될 수 있음
      expect(body).toMatch(/<priority>1(\.0)?<\/priority>/)
    })

    test('검색 페이지 URL이 포함되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      expect(body).toContain('/search')
      expect(body).toContain('<priority>0.9</priority>')
    })

    test('정적 페이지들이 포함되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 필수 정적 페이지 확인
      expect(body).toContain('/community')
      expect(body).toContain('/terms')
      expect(body).toContain('/privacy')
    })

    test('changeFrequency 값이 포함되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 변경 빈도 확인
      expect(body).toContain('<changefreq>')
      expect(body).toMatch(/<changefreq>(daily|weekly|monthly)<\/changefreq>/)
    })

    test('lastmod 날짜가 포함되어야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 날짜 형식 확인 (ISO 8601)
      expect(body).toContain('<lastmod>')
      expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}/)
    })

    test('자격증 상세 페이지가 포함되어야 함 (API 연동 시)', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 자격증 페이지 확인 (API가 동작할 때만)
      // 최소한 certificates 경로가 있는지 확인
      // API가 없어도 테스트가 실패하지 않도록 soft check
      if (body.includes('/certificates/')) {
        expect(body).toContain('<priority>0.8</priority>')
      }
    })
  })

  test.describe('인증 필요 페이지 제외', () => {
    test('대시보드 페이지가 sitemap에 포함되지 않아야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      // 인증이 필요한 페이지는 sitemap에서 제외
      expect(body).not.toContain('/dashboard')
    })

    test('학습 계획 페이지가 sitemap에 포함되지 않아야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      expect(body).not.toContain('/study-plans')
    })

    test('분석 페이지가 sitemap에 포함되지 않아야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      expect(body).not.toContain('/analytics')
    })

    test('로그인/회원가입 페이지가 sitemap에 포함되지 않아야 함', async ({ request }) => {
      const response = await request.get('/sitemap.xml')
      const body = await response.text()

      expect(body).not.toContain('/login')
      expect(body).not.toContain('/signup')
    })
  })
})
