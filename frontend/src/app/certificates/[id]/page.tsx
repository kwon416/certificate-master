import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { fetchCertificateById } from '@/lib/api/server'
import { CertificateJsonLd, JsonLd, createBreadcrumbData } from '@/components/seo'
import CertificateDetailContent from './certificate-detail-content'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * UUID v4 형식인지 확인
 */
function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

/**
 * 동적 메타데이터 생성
 * 크롤러가 자격증별 고유 title/description/OG 태그를 읽을 수 있도록 함
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const cert = await fetchCertificateById(id)

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

  if (!cert) {
    return {
      title: '자격증을 찾을 수 없습니다',
      description: '요청하신 자격증 정보를 찾을 수 없습니다.',
      robots: { index: false, follow: false },
      alternates: {
        canonical: `${SITE_URL}/certificates/${id}`,
      },
    }
  }

  // canonical URL은 항상 slug 기반
  const canonicalSlug = cert.slug || id

  const difficultyText = cert.difficulty
    ? `난이도 ${'★'.repeat(cert.difficulty)}${'☆'.repeat(5 - cert.difficulty)}`
    : ''
  const studyPeriodText = cert.study_period_days
    ? `준비기간 약 ${Math.round(cert.study_period_days / 30)}개월`
    : ''
  const statsText = [difficultyText, studyPeriodText].filter(Boolean).join(', ')

  // overview의 줄바꿈을 공백으로 치환하고, 문장 단위로 잘라서 깔끔한 description 생성
  const cleanOverview = cert.overview
    ? cert.overview.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
  const maxDescLen = 120
  const prefix = `${cert.title} 자격증 정보 - ${statsText ? statsText + '. ' : ''}`
  const remainLen = maxDescLen - prefix.length
  let overviewSnippet = ''
  if (cleanOverview && remainLen > 20) {
    const truncated = cleanOverview.substring(0, remainLen)
    // 마지막 마침표(.) 위치에서 자르기, 없으면 마지막 공백에서 자르기
    const lastPeriod = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastPeriod > remainLen * 0.5) {
      overviewSnippet = truncated.substring(0, lastPeriod + 1)
    } else if (lastSpace > remainLen * 0.5) {
      overviewSnippet = truncated.substring(0, lastSpace)
    } else {
      overviewSnippet = truncated
    }
  }

  const description = overviewSnippet
    ? `${prefix}${overviewSnippet}`
    : `${cert.title} 자격증 정보 - ${statsText ? statsText + '. ' : ''}시험 과목, 합격률, 응시료, 학습 가이드를 한눈에 확인하세요.`

  // layout.tsx의 title template이 '%s | 자격증 마스터'이므로, 여기선 '| 자격증 마스터' 제외
  const title = `${cert.title} - 시험정보, 난이도, 합격률`

  // 동적 키워드 생성: 자격증명 기반 검색어 조합
  const categoryName = cert.categories?.[0]?.name
  const keywords = [
    cert.title,
    `${cert.title} 시험`,
    `${cert.title} 합격률`,
    `${cert.title} 난이도`,
    `${cert.title} 준비`,
    `${cert.title} 공부방법`,
    `${cert.title} 시험일정`,
    ...(categoryName ? [categoryName, `${categoryName} 자격증`] : []),
    ...(cert.series ? [`${cert.series} 자격증`] : []),
    '자격증 시험',
    '자격증 정보',
  ].filter(Boolean)

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${cert.title} - 시험정보, 난이도, 합격률`,
      description,
      type: 'article',
      locale: 'ko_KR',
      siteName: '자격증 마스터',
      url: `${SITE_URL}/certificates/${canonicalSlug}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${cert.title} - 자격증 마스터` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cert.title} - 시험정보, 난이도, 합격률`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/certificates/${canonicalSlug}`,
    },
  }
}

/**
 * 자격증 상세 페이지 (서버 컴포넌트)
 *
 * SSR로 데이터를 fetch하여 크롤러가 콘텐츠를 읽을 수 있게 함.
 * UUID로 접근 시 slug URL로 301 redirect합니다.
 * 인터랙티브 UI는 CertificateDetailContent 클라이언트 컴포넌트에 위임.
 */
export default async function CertificateDetailPage({ params }: PageProps) {
  const { id } = await params
  const cert = await fetchCertificateById(id)

  if (!cert) {
    notFound()
  }

  // UUID로 접근했고, slug가 존재하면 slug URL로 301 redirect
  if (isUUID(id) && cert.slug) {
    redirect(`/certificates/${cert.slug}`)
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'
  const canonicalSlug = cert.slug || id
  const breadcrumbData = createBreadcrumbData([
    { name: '홈', url: SITE_URL },
    { name: '자격증 검색', url: `${SITE_URL}/` },
    { name: cert.title, url: `${SITE_URL}/certificates/${canonicalSlug}` },
  ])

  return (
    <>
      <CertificateJsonLd
        certificate={{
          id: cert.id,
          title: cert.title,
          overview: cert.overview ?? undefined,
          category: cert.categories?.[0]?.name,
          difficulty: cert.difficulty ? `${cert.difficulty}/5` : undefined,
        }}
      />
      <JsonLd type="BreadcrumbList" data={breadcrumbData} />
      <CertificateDetailContent certificate={cert} />
    </>
  )
}
