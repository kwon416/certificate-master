/**
 * MatchScoreBadge Component
 *
 * 추천 적합도 점수 배지
 */
'use client'

import { cn } from '@/lib/utils'

interface MatchScoreBadgeProps {
  score: number // 0-100
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    if (score >= 75) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    if (score >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }

  const getLabel = (score: number) => {
    if (score >= 90) return '최적 매치'
    if (score >= 75) return '추천'
    if (score >= 60) return '적합'
    return '고려 가능'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border text-xs md:text-sm font-medium',
        getColor(score)
      )}
    >
      <span className="text-base md:text-lg font-bold">{score}%</span>
      <span>{getLabel(score)}</span>
    </div>
  )
}
