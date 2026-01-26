'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Grid3X3, List, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CertificateCard,
  SearchInput
} from '@/components/certificate'
import {
  SearchTabs,
  InteractionWizard,
  RecommendationResults,
  type SearchTabType,
} from '@/components/recommend'
import { EmptyState } from '@/components/ui/empty-state'
import { useSearchStore } from '@/stores/search-store'
import { useRecommendStore } from '@/stores/recommend-store'
import { useInfiniteCertificates } from '@/hooks'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import type { Certificate, CertificateList } from '@/lib/api'

export function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { query, setQuery } = useSearchStore()
  const { recommendations } = useRecommendStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<SearchTabType>('recommend')

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null)

  // Set initial query from URL
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      setActiveTab('search') // Switch to search tab if query is provided
    }
  }, [initialQuery, setQuery])

  // Debounce search parameters to reduce API calls
  const debouncedQuery = useDebounce(query, 300)
  // Fetch certificates with infinite scroll (only when search tab is active)
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCertificates({
    q: debouncedQuery || undefined,
    code: undefined,
    page_size: 20, // 20 items per page
  }, {
    enabled: activeTab === 'search', // Only fetch when search tab is active
  })

  // Flatten all pages into single array
  const results: Certificate[] = data?.pages ? data.pages.flatMap((page: CertificateList) => page.items) : []
  const totalCount: number = data?.pages && data.pages.length > 0 ? data.pages[0].total : 0

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (activeTab !== 'search') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery)
  }

  const handleFavoriteToggle = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            자격증 검색
          </h1>
          <p className="text-slate-400">
            AI 추천으로 나에게 맞는 자격증을 찾거나, 필요한 자격증을 검색해보세요
          </p>
        </div>

        {/* Tabs */}
        <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'recommend' ? (
          /* Recommendation Tab Content */
          recommendations ? (
            <RecommendationResults />
          ) : (
            <InteractionWizard />
          )
        ) : (
          /* Search Tab Content */
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <SearchInput
                initialQuery={query}
                onSearch={handleSearch}
                placeholder="자격증명, 분야 등을 입력하세요..."
              />
            </div>

            <div className="flex flex-col gap-8">
              {/* Results */}
              <div>
                {/* API Error State */}
                {error && !isLoading && (
                  <EmptyState
                    icon={AlertCircle}
                    title="데이터를 불러올 수 없습니다"
                    description="서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
                    action={{
                      label: '다시 시도',
                      onClick: () => window.location.reload(),
                    }}
                  />
                )}

                {/* Results Header */}
                {!error && !isLoading && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-slate-700 text-slate-300">
                        {totalCount > 0 ? `${totalCount}개 결과` : '0개 결과'}
                      </Badge>
                      {query && (
                        <span className="text-slate-400">
                          &quot;{query}&quot; 검색 결과
                        </span>
                      )}
                    </div>

                    {/* View Mode Toggle */}
                    {results.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 hidden sm:inline">
                          보기 방식
                        </span>
                        <div className="flex rounded-lg bg-slate-800/50 p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              'h-8 w-8',
                              viewMode === 'grid'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                            )}
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={cn(
                              'h-8 w-8',
                              viewMode === 'list'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                            )}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Initial Loading State */}
                {isLoading && results.length === 0 && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  </div>
                )}

                {/* No Results */}
                {!error && !isLoading && results.length === 0 && (
                  <EmptyState
                    icon={Search}
                    title={query ? '검색 결과가 없습니다' : '자격증을 검색해보세요'}
                    description={
                      query
                        ? '다른 검색어를 입력해보세요.'
                        : '위의 검색창에 원하는 자격증명을 입력하세요.'
                    }
                    action={
                      query
                        ? {
                            label: '검색 초기화',
                            onClick: () => setQuery(''),
                          }
                        : undefined
                    }
                  />
                )}

                {/* Results Grid */}
                {!error && results.length > 0 && (
                  <>
                    <div
                      className={cn(
                        'grid gap-6',
                        viewMode === 'grid'
                          ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                          : 'grid-cols-1'
                      )}
                    >
                      {results.map((cert, index) => (
                        <div
                          key={`${cert.id}-${index}`}
                          className="animate-slide-up"
                          style={{ animationDelay: `${(index % 20) * 0.05}s` }}
                        >
                          <CertificateCard
                            id={cert.id}
                            title={cert.title}
                            categories={cert.categories}
                            difficulty={cert.difficulty ?? null}
                            passRate={cert.passing_rate ? cert.passing_rate / 100 : null}
                            studyPeriod={cert.study_period_days ?? null}
                            overview={cert.overview ?? null}
                            isFavorite={favorites.has(cert.id)}
                            onFavoriteToggle={handleFavoriteToggle}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Infinite Scroll Trigger & Loading Indicator */}
                    <div ref={observerTarget} className="mt-8 flex justify-center">
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>더 많은 결과를 불러오는 중...</span>
                        </div>
                      )}
                      {!hasNextPage && results.length > 0 && (
                        <div className="text-slate-500 text-sm">
                          모든 결과를 불러왔습니다 ({totalCount}개)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
