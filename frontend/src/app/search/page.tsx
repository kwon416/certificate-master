import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { SearchContent } from './search-content'

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
