/**
 * RecommendationResults Component
 *
 * 추천 결과 목록 표시
 */
'use client'

import { useMemo } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendationCard } from './recommendation-card'
import { useRecommendStore } from '@/stores/recommend-store'
import type { RecommendedCertificate } from '@/lib/api/recommendations'

type NormalizedRecommendation = RecommendedCertificate & { rank: number }

export function RecommendationResults() {
  const { recommendations, querySummary, resetWizard } = useRecommendStore()

  const normalized: NormalizedRecommendation[] = useMemo(() => {
    if (!recommendations) return []
    return recommendations.map((rec, index) => ({
      ...rec,
      rank: index + 1,
    }))
  }, [recommendations])

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">추천 결과가 없습니다.</p>
        <Button onClick={resetWizard} variant="outline" className="group">
          <RefreshCcw className="w-5 h-5 mr-2 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
          다시 추천받기
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white">추천 결과</h2>
          <p className="text-sm text-slate-400">
            상위 {recommendations.length}개의 자격증을 보여드려요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={resetWizard} variant="outline" size="sm" className="group">
            <RefreshCcw className="w-5 h-5 mr-2 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            다시 추천받기
          </Button>
        </div>
      </div>

      {/* Query Summary */}
      {querySummary && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
          <p className="text-sm font-semibold text-emerald-200 mb-2">추천 요약</p>
          <p className="text-base leading-relaxed text-slate-100">{querySummary}</p>
        </div>
      )}

      {/* Recommendation Cards */}
      {normalized.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-8 text-center">
          <p className="text-slate-300 mb-3">조건에 맞는 추천이 없습니다.</p>
          <p className="text-slate-500 text-sm mb-4">
            다시 추천을 받아보세요.
          </p>
          <Button onClick={resetWizard} variant="outline" className="group">
            <RefreshCcw className="w-5 h-5 mr-2 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            다시 추천받기
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {normalized.map((rec) => (
            <RecommendationCard
              key={rec.certificate.id || rec.rank}
              recommendation={rec}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-12 text-center">
        <p className="text-slate-400 mb-4">다른 추천을 받고 싶으신가요?</p>
        <Button onClick={resetWizard} variant="outline" className="px-8 group">
          <RefreshCcw className="w-5 h-5 mr-2 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
          다시 추천받기
        </Button>
      </div>
    </div>
  )
}
