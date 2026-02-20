const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

interface JsonLdProps {
  type: 'WebSite' | 'Organization' | 'BreadcrumbList' | 'Course' | 'FAQPage'
  data?: Record<string, unknown>
}

export function JsonLd({ type, data }: JsonLdProps) {
  let structuredData: Record<string, unknown> = {}

  switch (type) {
    case 'WebSite':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '자격증 마스터',
        alternateName: ['자격증마스터', '자격증 마스터', 'Certificate Master', 'cert master', 'certmaster'],
        url: SITE_URL,
        description: '600개 이상의 자격증 정보를 한눈에! 난이도, 합격률, 시험일정까지 비교하고 나에게 맞는 자격증을 찾아보세요.',
        inLanguage: 'ko-KR',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        ...data,
      }
      break

    case 'Organization':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '자격증 마스터',
        url: SITE_URL,
        logo: `${SITE_URL}/android-icon-192x192.png`,
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@i-ve.ai',
          contactType: 'customer service',
          availableLanguage: 'Korean',
        },
        ...data,
      }
      break

    case 'BreadcrumbList':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        ...data,
      }
      break

    case 'Course':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        provider: {
          '@type': 'Organization',
          name: '자격증 마스터',
          url: SITE_URL,
        },
        ...data,
      }
      break

    case 'FAQPage':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        ...data,
      }
      break
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// 자격증 상세 페이지용 JSON-LD
interface CertificateJsonLdProps {
  certificate: {
    id: string
    title: string
    overview?: string
    category?: string
    difficulty?: string
    passing_rate?: string
  }
}

export function CertificateJsonLd({ certificate }: CertificateJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: certificate.title,
    description: certificate.overview || `${certificate.title} 자격증 정보, 시험일정, 합격률, 난이도 등을 확인하세요.`,
    provider: {
      '@type': 'Organization',
      name: '자격증 마스터',
      url: SITE_URL,
    },
    educationalCredentialAwarded: certificate.title,
    ...(certificate.category && { courseCode: certificate.category }),
    ...(certificate.difficulty && {
      educationalLevel: certificate.difficulty,
    }),
    offers: {
      '@type': 'Offer',
      category: '자격증',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// 블로그 아티클 JSON-LD
interface BlogArticleJsonLdProps {
  post: {
    slug: string
    title: string
    description: string
    publishedAt: string
    updatedAt: string
    category: string
  }
}

export function BlogArticleJsonLd({ post }: BlogArticleJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: '자격증 마스터',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: '자격증 마스터',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/android-icon-192x192.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    articleSection: post.category,
    inLanguage: 'ko-KR',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Breadcrumb 생성 헬퍼
export function createBreadcrumbData(items: { name: string; url: string }[]) {
  return {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
