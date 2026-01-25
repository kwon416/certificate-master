/**
 * RecommendationCard Component
 *
 * 추천 자격증 카드
 */
'use client'

import Link from 'next/link'
import { type ReactNode, useMemo } from 'react'
import {
  Clock3,
  TrendingUp,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MatchScoreBadge } from './match-score-badge'
import type { RecommendedCertificate } from '@/lib/api/recommendations'

interface RecommendationCardProps {
  recommendation: RecommendedCertificate
}

const parseNumericValue = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const formatStudyPeriod = (days: number | null): string => {
  if (!days) return '준비 기간 정보 없음'
  const months = Math.max(1, Math.round(days / 30))
  return months >= 12 ? `약 ${Math.round(months / 12)}년` : `약 ${months}개월`
}

const formatDifficulty = (difficulty?: number | null): string => {
  if (!difficulty) return '난이도 정보 없음'
  if (difficulty <= 1) return '매우 쉬움'
  if (difficulty <= 2) return '쉬움'
  if (difficulty <= 3) return '보통'
  if (difficulty <= 4) return '어려움'
  return '매우 어려움'
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { certificate, recommendation_reason, key_points, feasibility } = recommendation

  const matchScore = useMemo(
    () => parseNumericValue(recommendation.match_score) ?? 0,
    [recommendation.match_score]
  )

  const estimatedDays = useMemo(
    () => parseNumericValue(feasibility?.estimated_days),
    [feasibility?.estimated_days]
  )

  const effectiveDuration = estimatedDays ?? parseNumericValue(certificate.study_period_days) ?? null
  const keyPoints = key_points ?? []
  const qualificationLabel =
    certificate.qualification_type ||
    certificate.series ||
    certificate.categories[0]?.name ||
    '자격 구분 정보 없음'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/5 card-hover">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10" />
      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="space-y-2">
              <Link href={`/certificates/${certificate.id}`} className="block group">
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {certificate.title}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {certificate.categories.map((cat, idx) => (
                  <span key={idx} className="rounded-full bg-slate-800 px-2 py-1">{cat.name}</span>
                ))}
                {certificate.series && (
                  <span className="rounded-full bg-slate-800 px-2 py-1">
                    {certificate.series}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 sm:min-w-[220px]">
            <MatchScoreBadge score={matchScore} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoChip
            icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
            label="난이도"
            value={formatDifficulty(certificate.difficulty)}
          />
          <InfoChip
            icon={<Clock3 className="w-4 h-4 text-cyan-300" />}
            label="예상 준비"
            value={formatStudyPeriod(effectiveDuration)}
          />
          <InfoChip
            icon={<BarChart3 className="w-4 h-4 text-amber-300" />}
            label="자격 구분"
            value={qualificationLabel}
          />
        </div>

        {/* Recommendation Reason */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            추천 이유
          </p>
          <p className="mt-3 text-base leading-relaxed text-slate-50">
            {recommendation_reason}
          </p>
        </div>

        {/* Key Points */}
        {keyPoints.length > 0 && (
          <div className="space-y-3">
            <span className="text-base font-semibold text-slate-200">
              핵심 포인트 {keyPoints.length}개
            </span>
            <ul className="grid gap-2 sm:grid-cols-2">
              {keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-3 text-base text-slate-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
            <Link href={`/certificates/${certificate.id}`}>상세 정보 보기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface InfoChipProps {
  icon: ReactNode
  label: string
  value: string
}

function InfoChip({ icon, label, value }: InfoChipProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}
