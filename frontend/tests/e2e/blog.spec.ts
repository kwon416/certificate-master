import { test, expect } from '@playwright/test'

test.describe('블로그 목록 페이지 (/blog)', () => {
  test('페이지가 200으로 로드되어야 함', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveTitle(/블로그/)
  })

  test('h1 제목이 표시되어야 함', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('블로그 포스트 카드가 3개 표시되어야 함', async ({ page }) => {
    await page.goto('/blog')
    const cards = page.locator('[data-testid="blog-post-card"]')
    await expect(cards).toHaveCount(3)
  })

  test('각 카드에 카테고리 배지가 있어야 함', async ({ page }) => {
    await page.goto('/blog')
    const badges = page.locator('[data-testid="blog-post-card"] [data-testid="category-badge"]')
    await expect(badges).toHaveCount(3)
  })

  test('각 카드에 제목(h2)이 있어야 함', async ({ page }) => {
    await page.goto('/blog')
    const headings = page.locator('[data-testid="blog-post-card"] h2')
    await expect(headings).toHaveCount(3)
  })

  test('각 카드에 설명 텍스트가 있어야 함', async ({ page }) => {
    await page.goto('/blog')
    const descs = page.locator('[data-testid="blog-post-card"] [data-testid="post-description"]')
    await expect(descs).toHaveCount(3)
  })

  test('각 카드에 날짜가 표시되어야 함', async ({ page }) => {
    await page.goto('/blog')
    const dates = page.locator('[data-testid="blog-post-card"] time')
    await expect(dates).toHaveCount(3)
  })

  test('각 카드에 "읽기" 링크가 있어야 함', async ({ page }) => {
    await page.goto('/blog')
    const links = page.locator('[data-testid="blog-post-card"] [data-testid="read-link"]')
    await expect(links).toHaveCount(3)
  })

  test('카드 그리드 레이아웃이 적용되어야 함', async ({ page }) => {
    await page.goto('/blog')
    const grid = page.locator('[data-testid="blog-posts-grid"]')
    await expect(grid).toBeVisible()
  })

  test('목록 페이지 metadata - og:type이 website여야 함', async ({ page }) => {
    await page.goto('/blog')
    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'website')
  })

  test('canonical URL이 /blog여야 함', async ({ page }) => {
    await page.goto('/blog')
    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/blog')
    expect(href).not.toMatch(/\/blog\/./)
  })
})

test.describe('블로그 상세 페이지 (/blog/[slug])', () => {
  const TEST_SLUG = 'jeongbo-chori-gisa-2026-guide'

  test('올바른 슬러그로 접근하면 200 페이지가 로드되어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    await expect(page.locator('article')).toBeVisible()
  })

  test('존재하지 않는 슬러그는 404를 반환해야 함', async ({ page }) => {
    const response = await page.goto('/blog/nonexistent-slug-xyz')
    expect(response?.status()).toBe(404)
  })

  test('포스트 제목이 h1으로 표시되어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('목차(nav[aria-label="목차"])가 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    // 모바일(lg:hidden)과 데스크탑(hidden lg:block) 두 개 있으므로 last()(데스크탑)가 visible
    await expect(page.locator('nav[aria-label="목차"]').last()).toBeVisible()
  })

  test('목차에 앵커 링크가 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const tocLinks = page.locator('nav[aria-label="목차"]').last().locator('a')
    await expect(tocLinks).not.toHaveCount(0)
  })

  test('본문 article 내에 h2 섹션이 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const sections = page.locator('article h2')
    await expect(sections).not.toHaveCount(0)
  })

  test('카테고리 배지가 표시되어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    await expect(page.locator('[data-testid="post-category"]')).toBeVisible()
  })

  test('게시일이 표시되어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    await expect(page.locator('time')).toBeVisible()
  })

  test('읽기 시간이 표시되어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    await expect(page.locator('[data-testid="read-time"]')).toBeVisible()
  })

  test('og:type이 article이어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'article')
  })

  test('article:published_time 메타태그가 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const publishedTime = page.locator('meta[property="article:published_time"]')
    await expect(publishedTime).toHaveCount(1)
  })

  test('canonical URL이 /blog/[slug]여야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain(`/blog/${TEST_SLUG}`)
  })
})

test.describe('블로그 상세 페이지 JSON-LD', () => {
  const TEST_SLUG = 'jeongbo-chori-gisa-2026-guide'

  test('Article JSON-LD 스크립트가 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const scripts = page.locator('script[type="application/ld+json"]')
    const count = await scripts.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Article JSON-LD에 @type: Article이 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const scripts = page.locator('script[type="application/ld+json"]')
    const count = await scripts.count()

    let hasArticle = false
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent()
      if (text) {
        try {
          const data = JSON.parse(text)
          if (data['@type'] === 'Article') {
            hasArticle = true
            break
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    expect(hasArticle).toBe(true)
  })

  test('BreadcrumbList JSON-LD가 있어야 함', async ({ page }) => {
    await page.goto(`/blog/${TEST_SLUG}`)
    const scripts = page.locator('script[type="application/ld+json"]')
    const count = await scripts.count()

    let hasBreadcrumb = false
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent()
      if (text) {
        try {
          const data = JSON.parse(text)
          if (data['@type'] === 'BreadcrumbList') {
            hasBreadcrumb = true
            break
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    expect(hasBreadcrumb).toBe(true)
  })
})

test.describe('블로그 sitemap', () => {
  test('/blog URL이 sitemap에 포함되어야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const body = await response.text()
    expect(body).toContain('/blog')
  })

  test('블로그 포스트 URL이 sitemap에 포함되어야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const body = await response.text()
    expect(body).toContain('/blog/취업-자격증-top5-2026')
  })
})

test.describe('푸터 블로그 링크', () => {
  test('푸터에 블로그 링크가 있어야 함', async ({ page }) => {
    await page.goto('/blog')
    const blogLink = page.locator('footer a[href="/blog"]')
    await expect(blogLink).toBeVisible()
  })
})

test.describe('블로그 내부 링크', () => {
  test('정보처리기사 포스트에서 자격증 상세 페이지로 내부 링크가 있어야 함', async ({ page }) => {
    await page.goto('/blog/jeongbo-chori-gisa-2026-guide')
    // /certificates/ 또는 /recommend 로의 내부 링크 중 하나 이상 존재
    const internalLinks = page.locator('article a[href^="/"]')
    const count = await internalLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})
