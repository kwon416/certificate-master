import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

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
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
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

  // 동적 자격증 페이지들 (API에서 가져오기)
  let certificatePages: MetadataRoute.Sitemap = []

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiUrl}/api/v1/certificates/search?page_size=1000`, {
      next: { revalidate: 86400 }, // 24시간마다 재검증
    })

    if (response.ok) {
      const data = await response.json()
      certificatePages = data.items?.map((cert: { id: string; updated_at?: string }) => ({
        url: `${SITE_URL}/certificates/${cert.id}`,
        lastModified: cert.updated_at ? new Date(cert.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) || []
    }
  } catch (error) {
    console.error('Failed to fetch certificates for sitemap:', error)
  }

  return [...staticPages, ...certificatePages]
}
