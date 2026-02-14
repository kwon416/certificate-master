import { Suspense } from 'react'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import { RecommendContent } from './recommend-content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: 'AI 자격증 추천',
  description: 'AI가 당신의 상황을 분석하여 맞춤 자격증을 추천합니다. 분야, 목표, 경험 수준에 맞는 자격증을 찾아보세요.',
  keywords: [
    'AI 자격증 추천',
    '자격증 추천',
    '맞춤 자격증',
    '자격증 찾기',
    '자격증 상담',
  ],
  openGraph: {
    title: 'AI 자격증 추천 | 자격증 마스터',
    description: 'AI가 당신의 상황을 분석하여 맞춤 자격증을 추천합니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/recommend`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'AI 자격증 추천 - 자격증 마스터' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 자격증 추천 | 자격증 마스터',
    description: 'AI가 당신의 상황을 분석하여 맞춤 자격증을 추천합니다.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/recommend`,
  },
}

function RecommendPageLoading() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI 자격증 추천
          </h1>
          <p className="text-muted-foreground">
            AI가 당신에게 맞는 자격증을 추천해드립니다
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    </div>
  )
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<RecommendPageLoading />}>
      <RecommendContent />
    </Suspense>
  )
}
