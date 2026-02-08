import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

/**
 * 서버 사이드 API URL 결정
 *
 * Docker 환경에서 Next.js 서버가 백엔드에 접근할 때:
 * - INTERNAL_API_URL: Docker 내부 네트워크용 (예: http://backend:8000)
 * - NEXT_PUBLIC_API_URL: 클라이언트/서버 공용 (예: http://localhost:8000)
 */
function getApiUrl(): string {
  return process.env.INTERNAL_API_URL
    || process.env.NEXT_PUBLIC_API_URL
    || 'http://localhost:8000'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/recommend`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 동적 자격증 페이지들 (API에서 페이지네이션으로 전체 가져오기)
  const certificatePages = await fetchCertificatePages()

  return [...staticPages, ...certificatePages]
}

async function fetchCertificatePages(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = getApiUrl()
  const PAGE_SIZE = 100
  const MAX_PAGES = 100 // 안전 제한: 최대 10,000건
  const FETCH_TIMEOUT = 10000 // 10초 타임아웃
  const certificatePages: MetadataRoute.Sitemap = []

  try {
    let currentPage = 1
    let hasMore = true

    while (hasMore && currentPage <= MAX_PAGES) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      try {
        const response = await fetch(
          `${apiUrl}/api/v1/certificates/search?page_size=${PAGE_SIZE}&page=${currentPage}`,
          {
            signal: controller.signal,
            next: { revalidate: 3600 }, // 1시간마다 재검증
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(
            `[Sitemap] API returned ${response.status} for page ${currentPage} (URL: ${apiUrl})`
          )
          break
        }

        const data = await response.json()
        const items = data.items?.map((cert: { id: string; updated_at?: string }) => ({
          url: `${SITE_URL}/certificates/${cert.id}`,
          lastModified: cert.updated_at ? new Date(cert.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })) || []

        certificatePages.push(...items)
        hasMore = data.has_more === true
        currentPage++
      } catch (pageError) {
        clearTimeout(timeoutId)
        if (pageError instanceof Error && pageError.name === 'AbortError') {
          console.error(`[Sitemap] Fetch timeout for page ${currentPage} (${FETCH_TIMEOUT}ms)`)
        } else {
          console.error(`[Sitemap] Fetch error for page ${currentPage}:`, pageError)
        }
        break
      }
    }

    if (certificatePages.length > 0) {
      console.log(`[Sitemap] Successfully fetched ${certificatePages.length} certificates`)
    } else {
      console.warn(`[Sitemap] No certificates fetched from API (URL: ${apiUrl})`)
    }
  } catch (error) {
    console.error('[Sitemap] Failed to fetch certificates:', error)
  }

  return certificatePages
}
