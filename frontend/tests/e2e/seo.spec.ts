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

  test('Organization 스키마의 contactPoint 이메일이 올바른 도메인을 사용해야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // Organization JSON-LD 파싱
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    expect(jsonLdMatches).not.toBeNull()

    let orgSchema: Record<string, unknown> | null = null
    for (const match of jsonLdMatches!) {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
      try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>
        if (parsed['@type'] === 'Organization') {
          orgSchema = parsed
          break
        }
      } catch {
        continue
      }
    }

    expect(orgSchema).not.toBeNull()
    // 존재하지 않는 certmaster.kr 도메인이 아닌 실제 운영 이메일을 사용해야 함
    const contactPoint = orgSchema!.contactPoint as Record<string, string> | undefined
    expect(contactPoint?.email).not.toContain('certmaster.kr')
    expect(contactPoint?.email).toContain('i-ve.ai')
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

  test('홈페이지 keywords에 브랜드 키워드 변형이 포함되어야 함 (띄어쓰기/붙여쓰기)', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/)
    expect(keywordsMatch).not.toBeNull()
    const keywords = keywordsMatch![1]
    // 붙여쓰기와 띄어쓰기 변형 모두 포함
    expect(keywords).toContain('자격증마스터')
    expect(keywords).toContain('자격증 마스터')
  })

  test('홈페이지 keywords에 타겟 검색 키워드가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/)
    expect(keywordsMatch).not.toBeNull()
    const keywords = keywordsMatch![1]

    // 유저가 요청한 타겟 키워드들
    const targetKeywords = [
      '2026자격증',
      '자격증추천',
      '자격증TOP10',
      '취업자격증',
      '이직자격증',
      'SQLD',
      '정보처리기사',
      '전기기사',
      '자격증트렌드',
      '자격증마스터',
      '기사자격증',
      '자격증시험',
      '국가자격증',
      '컴활자격증',
      '전기자격증',
      '자격증조회',
    ]

    for (const keyword of targetKeywords) {
      expect(keywords, `키워드 "${keyword}"가 meta keywords에 포함되어야 함`).toContain(keyword)
    }
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

test.describe('SEO - 브랜드 검색 최적화 (자격증마스터/자격증 마스터)', () => {
  test('WebSite JSON-LD의 alternateName에 띄어쓰기/붙여쓰기 변형이 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // JSON-LD 스크립트 파싱
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    expect(jsonLdMatches).not.toBeNull()

    // WebSite 타입 JSON-LD 찾기
    let websiteSchema: any = null
    for (const match of jsonLdMatches!) {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed['@type'] === 'WebSite') {
          websiteSchema = parsed
          break
        }
      } catch {
        continue
      }
    }

    expect(websiteSchema).not.toBeNull()
    expect(websiteSchema.alternateName).toContain('자격증마스터')
    expect(websiteSchema.alternateName).toContain('자격증 마스터')
    expect(websiteSchema.alternateName).toContain('Certificate Master')
    expect(websiteSchema.alternateName).toContain('cert master')
  })

  test('홈페이지 description에 브랜드명이 자연스럽게 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    // og:description 또는 meta description에서 브랜드명 확인
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)
    expect(descMatch).not.toBeNull()
    const description = descMatch![1]

    // description에 주요 타겟 키워드가 자연스럽게 포함되어야 함
    expect(description).toContain('자격증')
    expect(description).toContain('정보처리기사')
    expect(description).toContain('전기기사')
  })

  test('홈페이지 title에 "자격증 마스터"가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()
    expect(html).toMatch(/<title[^>]*>.*자격증 마스터.*<\/title>/)
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

    // 구현된 정적 페이지만 포함해야 함
    expect(body).toContain('/recommend')
    expect(body).toContain('/terms')
    expect(body).toContain('/privacy')
    // /community는 미구현 페이지이므로 sitemap에 없어야 함
    expect(body).not.toMatch(/\/community<\/loc>/)
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
