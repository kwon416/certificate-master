import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { HomeSearchContent } from './home-search-content'
import { fetchCertificateList } from '@/lib/api/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '자격증 마스터 - 600+ 자격증 검색 및 비교',
  description: '자격증마스터에서 600개 이상의 자격증을 검색하고 비교하세요. 정보처리기사, 전기기사, SQLD 등 2026 인기 국가자격증부터 취업·이직 자격증까지. 난이도, 합격률, 시험일정을 한눈에 확인하고 AI 추천으로 나에게 맞는 자격증을 찾아보세요.',
  keywords: [
    // 브랜드 키워드
    '자격증 마스터',
    '자격증마스터',
    // 핵심 검색 키워드
    '자격증 검색',
    '자격증 찾기',
    '자격증 시험',
    '자격증 준비',
    '자격증 공부',
    '자격증 시험일정',
    '자격증 합격률',
    '국가자격증 검색',
    '자격증 종류',
    '자격증 목록',
    '자격증 정보 사이트',
    // 타겟 검색 키워드
    '2026자격증',
    '자격증추천',
    '자격증TOP10',
    '취업자격증',
    '이직자격증',
    '자격증트렌드',
    '기사자격증',
    '자격증시험',
    '컴활자격증',
    '전기자격증',
    '자격증조회',
    // 인기 자격증
    '정보처리기사',
    '전기기사',
    'SQLD',
    '공인중개사',
  ],
  openGraph: {
    title: '자격증 마스터 - 600+ 자격증 검색 및 비교',
    description: '600개 이상의 자격증을 검색하고 비교하세요. 난이도, 합격률, 시험일정을 한눈에!',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: '자격증 마스터 - 자격증 검색 및 비교 플랫폼' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '자격증 마스터 - 600+ 자격증 검색 및 비교',
    description: '600개 이상의 자격증을 검색하고 비교하세요. 난이도, 합격률, 시험일정을 한눈에!',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

function SearchPageLoading() {
  return (
    <div className="min-h-screen">
      <section data-testid="home-hero" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-background to-background" />
        <div className="relative container mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              <span className="text-foreground">나에게 맞는 </span>
              <span className="gradient-text">자격증</span>
              <span className="text-foreground">을 찾아보세요</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              600개 이상의 자격증 정보를 한눈에 비교하세요
            </p>
          </div>
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default async function HomePage() {
  const certificates = await fetchCertificateList(30)

  return (
    <>
      <Suspense fallback={<SearchPageLoading />}>
        <HomeSearchContent />
      </Suspense>

      {/* SSR 내부 링크: Google 크롤러가 자격증 페이지를 발견할 수 있도록 */}
      {certificates.length > 0 && (
        <section
          data-testid="ssr-certificate-links"
          className="border-t border-border bg-muted/50"
        >
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              인기 자격증
            </h2>
            <nav aria-label="자격증 목록">
              <ul className="flex flex-wrap gap-2">
                {certificates.map((cert) => (
                  <li key={cert.id}>
                    <Link
                      href={`/certificates/${cert.slug || cert.id}`}
                      className="inline-block rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {cert.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      )}
    </>
  )
}
