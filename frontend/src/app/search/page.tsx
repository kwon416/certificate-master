import { Suspense } from 'react'
import { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import { SearchContent } from './search-content'

export const metadata: Metadata = {
  title: '자격증 검색',
  description: '3,500개 이상의 자격증을 검색하고 비교하세요. 정보처리기사, 전기기사, 공인중개사 등 국가자격증부터 민간자격증까지. 난이도, 합격률, 시험일정을 한눈에 확인할 수 있습니다.',
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
    description: '3,500개 이상의 자격증을 검색하고 비교하세요. 난이도, 합격률, 시험일정을 한눈에!',
  },
}

function SearchPageLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            자격증 검색
          </h1>
          <p className="text-slate-400">
            AI 추천으로 나에게 맞는 자격증을 찾거나, 필요한 자격증을 검색해보세요
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchContent />
    </Suspense>
  )
}
