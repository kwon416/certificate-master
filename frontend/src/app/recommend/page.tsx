import { Suspense } from 'react'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import { RecommendContent } from './recommend-content'

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
  },
}

function RecommendPageLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI 자격증 추천
          </h1>
          <p className="text-slate-400">
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
