/**
 * RecommendationResults Component
 *
 * 추천 결과 목록 표시
 */
'use client'

import { useMemo } from 'react'
import { RefreshCcw, Target, Briefcase, Clock, BarChart3, User, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendationCard } from './recommendation-card'
import { useRecommendStore } from '@/stores/recommend-store'
import type { RecommendedCertificate } from '@/lib/api/recommendations'

type NormalizedRecommendation = RecommendedCertificate & { rank: number }

// 요약 항목 파싱 및 아이콘 매핑
interface SummaryItem {
  label: string
  value: string
  icon: React.ReactNode
}

function parseSummary(summary: string): SummaryItem[] {
  const iconMap: Record<string, React.ReactNode> = {
    '목적': <Target className="w-3.5 h-3.5" />,
    '분야': <Briefcase className="w-3.5 h-3.5" />,
    '기간': <Clock className="w-3.5 h-3.5" />,
    '난이도': <BarChart3 className="w-3.5 h-3.5" />,
    '경험': <User className="w-3.5 h-3.5" />,
  }

  // "|" 또는 "," 로 구분된 항목 파싱
  const parts = summary.split(/[|,]/).map(s => s.trim()).filter(Boolean)

  return parts.map(part => {
    // "라벨: 값" 형식 파싱
    const colonIndex = part.indexOf(':')
    if (colonIndex > 0) {
      const label = part.slice(0, colonIndex).trim()
      const value = part.slice(colonIndex + 1).trim()
      return {
        label,
        value,
        icon: iconMap[label] || <Target className="w-3.5 h-3.5" />,
      }
    }
    // 구분자 없으면 전체를 값으로
    return {
      label: '',
      value: part,
      icon: <Target className="w-3.5 h-3.5" />,
    }
  })
}

export function RecommendationResults() {
  const { recommendations, querySummary, answers, resetWizard } = useRecommendStore()
  const userSummary = answers.user_summary

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
        <p className="text-muted-foreground mb-4">추천 결과가 없습니다.</p>
        <Button onClick={resetWizard} variant="outline" className="group">
          <RefreshCcw className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
          다시 추천받기
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5 md:space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">추천 결과</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            상위 {recommendations.length}개의 자격증을 보여드려요.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button onClick={resetWizard} variant="outline" size="sm" className="group h-9 md:h-10 text-sm">
            <RefreshCcw className="w-4 h-4 mr-1.5 md:mr-2 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            다시 추천받기
          </Button>
        </div>
      </div>

      {/* User Summary - 사용자가 입력한 원본 요청 표시 */}
      {userSummary && (
        <div className="rounded-xl md:rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 md:p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/10">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">내 요청</p>
              <p className="text-sm md:text-base text-foreground">&ldquo;{userSummary}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

      {/* Query Summary - 태그 형태로 표시 */}
      {querySummary && (
        <div className="rounded-xl md:rounded-2xl border border-border bg-card/70 p-3 md:p-4">
          <p className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-200 mb-2 md:mb-3">검색 조건</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {parseSummary(querySummary).map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-muted border border-border/50"
              >
                <span className="text-emerald-600 dark:text-emerald-400">{item.icon}</span>
                {item.label && (
                  <span className="text-[10px] md:text-xs text-muted-foreground">{item.label}</span>
                )}
                <span className="text-xs md:text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Cards */}
      {normalized.length === 0 ? (
        <div className="rounded-xl md:rounded-2xl border border-border bg-card/70 p-5 md:p-8 text-center">
          <p className="text-foreground/80 mb-2 md:mb-3 text-sm md:text-base">조건에 맞는 추천이 없습니다.</p>
          <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">
            다시 추천을 받아보세요.
          </p>
          <Button onClick={resetWizard} variant="outline" className="group">
            <RefreshCcw className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            다시 추천받기
          </Button>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-6">
          {normalized.map((rec) => (
            <RecommendationCard
              key={rec.certificate.id || rec.rank}
              recommendation={rec}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-6 md:mt-12 text-center pb-4">
        <p className="text-muted-foreground mb-3 md:mb-4 text-sm md:text-base">다른 추천을 받고 싶으신가요?</p>
        <Button onClick={resetWizard} variant="outline" className="px-6 md:px-8 group">
          <RefreshCcw className="w-4 h-4 mr-1.5 md:mr-2 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
          다시 추천받기
        </Button>
      </div>
    </div>
  )
}
