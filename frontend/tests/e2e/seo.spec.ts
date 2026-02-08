import { test, expect } from '@playwright/test'

test.describe('SEO - JSON-LD 구조화 데이터', () => {
  test('홈페이지 HTML 소스에 WebSite 스키마가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // JSON-LD가 서버 렌더링된 HTML에 포함되어야 함 (not afterInteractive)
    expect(html).toContain('application/ld+json')
    expect(html).toContain('"@type":"WebSite"')
  })

  test('홈페이지 HTML 소스에 Organization 스키마가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    expect(html).toContain('"@type":"Organization"')
  })

  test('Organization 스키마에 유효한 logo URL이 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // 실제 존재하는 파일을 참조해야 함
    expect(html).toContain('android-icon-192x192.png')
    // 존재하지 않는 파일을 참조하면 안 됨
    expect(html).not.toContain('web-app-manifest-512x512.png')
  })

  test('자격증 상세 페이지에 Course 스키마가 포함되어야 함', async ({ request }) => {
    // 먼저 실제 자격증 ID를 찾기 위해 검색 API 사용
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')

    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const certId = searchData.items[0].id
    const pageResponse = await request.get(`/certificates/${certId}`)
    const html = await pageResponse.text()

    expect(html).toContain('"@type":"Course"')
  })

  test('자격증 상세 페이지에 BreadcrumbList 스키마가 포함되어야 함', async ({ request }) => {
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')

    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const certId = searchData.items[0].id
    const pageResponse = await request.get(`/certificates/${certId}`)
    const html = await pageResponse.text()

    expect(html).toContain('"@type":"BreadcrumbList"')
  })
})

test.describe('SEO - 메타 태그', () => {
  test('자격증 상세 페이지의 canonical URL이 /certificates/{id} 형태여야 함', async ({ request }) => {
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')

    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const certId = searchData.items[0].id
    const pageResponse = await request.get(`/certificates/${certId}`)
    const html = await pageResponse.text()

    // canonical URL이 해당 자격증 페이지를 가리켜야 함
    expect(html).toMatch(new RegExp(`<link[^>]*rel="canonical"[^>]*href="[^"]*\\/certificates\\/${certId}"`))
  })

  test('홈페이지에 canonical URL이 있어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    expect(html).toMatch(/<link[^>]*rel="canonical"/)
  })

  test('추천 페이지에 canonical URL이 있어야 함', async ({ request }) => {
    const response = await request.get('/recommend')
    const html = await response.text()

    expect(html).toMatch(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/recommend"/)
  })

  test('About 페이지에 고유 title이 있어야 함', async ({ page }) => {
    await page.goto('/about')
    const title = await page.title()
    expect(title).toContain('자격증 마스터')
    expect(title).not.toBe('자격증 마스터 - 600+ 자격증 검색 및 비교') // 기본 title과 달라야 함
  })

  test('Privacy 페이지에 고유 title이 있어야 함', async ({ page }) => {
    await page.goto('/privacy')
    const title = await page.title()
    expect(title).toContain('개인정보')
  })

  test('Terms 페이지에 고유 title이 있어야 함', async ({ page }) => {
    await page.goto('/terms')
    const title = await page.title()
    expect(title).toContain('이용약관')
  })

  test('Community 페이지에 고유 title이 있어야 함', async ({ page }) => {
    await page.goto('/community')
    const title = await page.title()
    expect(title).toContain('커뮤니티')
  })
})

test.describe('SEO - 홈페이지 타이틀', () => {
  test('홈페이지 title이 기본 브랜드 title을 사용해야 함', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    // 홈페이지는 template이 아닌 기본 title을 사용해야 함
    expect(title).toBe('자격증 마스터 - 600+ 자격증 검색 및 비교')
  })
})

test.describe('SEO - Canonical URL', () => {
  test('추천 페이지의 canonical URL이 /recommend를 포함해야 함', async ({ request }) => {
    const response = await request.get('/recommend')
    const html = await response.text()
    expect(html).toMatch(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/recommend"/)
  })

  test('커뮤니티 페이지의 canonical URL이 /community를 포함해야 함', async ({ request }) => {
    const response = await request.get('/community')
    const html = await response.text()
    expect(html).toMatch(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/community"/)
  })

  test('개인정보처리방침 페이지의 canonical URL이 /privacy를 포함해야 함', async ({ request }) => {
    const response = await request.get('/privacy')
    const html = await response.text()
    expect(html).toMatch(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/privacy"/)
  })

  test('이용약관 페이지의 canonical URL이 /terms를 포함해야 함', async ({ request }) => {
    const response = await request.get('/terms')
    const html = await response.text()
    expect(html).toMatch(/<link[^>]*rel="canonical"[^>]*href="[^"]*\/terms"/)
  })
})

test.describe('SEO - Keywords 메타 태그', () => {
  test('홈페이지에 keywords 메타 태그가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*name="keywords"[^>]*content="[^"]*자격증[^"]*"/)
  })

  test('홈페이지 keywords에 주요 검색어가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    // keywords 메타 태그에서 content 추출
    const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/)
    expect(keywordsMatch).not.toBeNull()
    const keywords = keywordsMatch![1]
    // 주요 검색어 포함 확인
    expect(keywords).toContain('자격증 시험')
    expect(keywords).toContain('자격증 준비')
    expect(keywords).toContain('자격증 공부')
  })

  test('자격증 상세 페이지에 동적 keywords가 포함되어야 함', async ({ request }) => {
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')
    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const cert = searchData.items[0]
    const pageResponse = await request.get(`/certificates/${cert.id}`)
    const html = await pageResponse.text()

    // keywords 메타 태그가 존재해야 함
    expect(html).toMatch(/<meta[^>]*name="keywords"[^>]*content="[^"]*"/)

    // 자격증 제목이 keywords에 포함되어야 함
    const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/)
    expect(keywordsMatch).not.toBeNull()
    const keywords = keywordsMatch![1]
    expect(keywords).toContain(cert.title)

    // 자격증명 + 시험정보 같은 동적 키워드가 포함되어야 함
    expect(keywords).toContain(`${cert.title} 시험`)
    expect(keywords).toContain(`${cert.title} 합격률`)
  })

  test('추천 페이지에 keywords 메타 태그가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/recommend')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*name="keywords"[^>]*content="[^"]*자격증 추천[^"]*"/)
  })
})

test.describe('SEO - OG/Twitter 메타 태그 완성 (티스토리/카카오 링크 미리보기)', () => {
  test('홈페이지에 og:image가 절대 URL로 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    // og:image가 https://로 시작하는 절대 URL이어야 함 (티스토리/카카오 필수)
    expect(html).toMatch(/<meta[^>]*property="og:image"[^>]*content="https:\/\/[^"]*og-image\.png"/)
  })

  test('홈페이지에 og:url이 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*property="og:url"[^>]*content="https:\/\//)
  })

  test('홈페이지에 og:type이 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*property="og:type"[^>]*content="website"/)
  })

  test('홈페이지에 og:site_name이 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*property="og:site_name"[^>]*content="자격증 마스터"/)
  })

  test('추천 페이지에 og:image가 절대 URL로 포함되어야 함', async ({ request }) => {
    const response = await request.get('/recommend')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*property="og:image"[^>]*content="https:\/\//)
  })

  test('추천 페이지에 og:url이 /recommend를 포함해야 함', async ({ request }) => {
    const response = await request.get('/recommend')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*property="og:url"[^>]*content="[^"]*\/recommend"/)
  })

  test('홈페이지에 twitter:image가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<meta[^>]*name="twitter:image"[^>]*content="https:\/\//)
  })

  test('자격증 상세 페이지에 og:image가 절대 URL로 포함되어야 함', async ({ request }) => {
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')
    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const certId = searchData.items[0].id
    const pageResponse = await request.get(`/certificates/${certId}`)
    const html = await pageResponse.text()

    expect(html).toMatch(/<meta[^>]*property="og:image"[^>]*content="https:\/\/[^"]*og-image\.png"/)
  })

  test('자격증 상세 페이지에 og:type이 article이어야 함', async ({ request }) => {
    const searchResponse = await request.get('/api/v1/certificates/search?page_size=1')
    if (searchResponse.status() !== 200) {
      test.skip()
      return
    }

    const searchData = await searchResponse.json()
    if (!searchData.items || searchData.items.length === 0) {
      test.skip()
      return
    }

    const certId = searchData.items[0].id
    const pageResponse = await request.get(`/certificates/${certId}`)
    const html = await pageResponse.text()

    expect(html).toMatch(/<meta[^>]*property="og:type"[^>]*content="article"/)
  })
})

test.describe('SEO - 커스텀 에러 페이지', () => {
  test('존재하지 않는 경로에 커스텀 404 페이지가 표시되어야 함', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-xyz-12345')
    // 404 상태 코드
    expect(response?.status()).toBe(404)
    // 커스텀 404 메시지가 표시되어야 함
    await expect(page.getByRole('heading', { name: /찾을 수 없/i })).toBeVisible()
  })

  test('404 페이지에 홈으로 돌아가기 링크가 있어야 함', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz-12345')
    await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toBeVisible()
  })
})

test.describe('SEO - Sitemap 개선', () => {
  test('sitemap이 유효한 XML이고 정적 페이지를 포함해야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const body = await response.text()

    // 정적 페이지 필수 포함
    expect(body).toContain('/recommend')
    expect(body).toContain('/community')
    expect(body).toContain('/terms')
    expect(body).toContain('/privacy')
  })

  test('sitemap에 자격증 페이지가 포함되어야 함 (API 연동)', async ({ request }) => {
    // API가 동작하는지 먼저 확인
    const apiCheck = await request.get('/api/v1/certificates/search?page_size=1')
    if (apiCheck.status() !== 200) {
      test.skip()
      return
    }

    const response = await request.get('/sitemap.xml')
    const body = await response.text()

    // /certificates/ 경로의 URL 개수를 셈
    const certMatches = body.match(/\/certificates\/[a-f0-9-]+/g) || []

    // API가 동작하면 반드시 자격증이 포함되어야 함
    expect(certMatches.length).toBeGreaterThan(100)
  })

  test('sitemap 자격증 URL이 유효한 UUID 형식이어야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const body = await response.text()

    const certMatches = body.match(/\/certificates\/[a-f0-9-]+/g) || []
    if (certMatches.length > 0) {
      // UUID 형식 검증 (8-4-4-4-12)
      const uuidPattern = /\/certificates\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
      expect(certMatches[0]).toMatch(uuidPattern)
    }
  })
})
