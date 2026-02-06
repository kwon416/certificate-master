import { Suspense } from 'react'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import { HomeSearchContent } from './home-search-content'

export const metadata: Metadata = {
  title: '자격증 검색',
  description: '600개 이상의 자격증을 검색하고 비교하세요. 정보처리기사, 전기기사, 공인중개사 등 국가자격증부터 민간자격증까지. 난이도, 합격률, 시험일정을 한눈에 확인할 수 있습니다.',
  keywords: [
    '자격증 검색',
    '자격증 찾기',
    '국가자격증 검색',
    '자격증 종류',
    '자격증 목록',
    '정보처리기사',
    '전기기사',
    '공인중개사',
  ],
  openGraph: {
    title: '자격증 검색 | 자격증 마스터',
    description: '600개 이상의 자격증을 검색하고 비교하세요. 난이도, 합격률, 시험일정을 한눈에!',
  },
}

function SearchPageLoading() {
  return (
    <div className="min-h-screen">
      <section data-testid="home-hero" className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-slate-950 to-slate-950" />
        <div className="relative container mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              <span className="text-white">나에게 맞는 </span>
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">자격증</span>
              <span className="text-white">을 찾아보세요</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400">
              600개 이상의 자격증 정보를 한눈에 비교하세요
            </p>
          </div>
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <HomeSearchContent />
    </Suspense>
  )
}
