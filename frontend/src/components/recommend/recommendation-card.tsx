/**
 * RecommendationCard Component
 *
 * 추천 자격증 카드 (간결한 버전)
 */
'use client'

import Link from 'next/link'
import { type ReactNode, useMemo } from 'react'
import {
  Clock3,
  TrendingUp,
  Sparkles,
  FileText,
  Lightbulb,
  Briefcase,
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
  if (!days) return '정보 없음'
  const months = Math.max(1, Math.round(days / 30))
  return months >= 12 ? `약 ${Math.round(months / 12)}년` : `약 ${months}개월`
}

const formatDifficulty = (difficulty?: number | null): string => {
  if (!difficulty) return '정보 없음'
  if (difficulty <= 1) return '매우 쉬움'
  if (difficulty <= 2) return '쉬움'
  if (difficulty <= 3) return '보통'
  if (difficulty <= 4) return '어려움'
  return '매우 어려움'
}

// 핵심 포인트 필터링: 중복/불필요 항목 제거
const filterKeyPoints = (points: string[]): string[] => {
  return points.filter(point => {
    const lower = point.toLowerCase()
    // "학습 팁:" 패턴 제외 (study_insights에서 표시)
    if (lower.includes('학습 팁:') || lower.includes('학습팁:')) return false
    // "약 N개월 준비" 패턴 제외 (Quick Stats에서 표시)
    if (/약\s*\d+\s*(개월|년)\s*준비/.test(point)) return false
    return true
  })
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

  // 핵심 포인트: 필터링 후 최대 3개
  const filteredKeyPoints = useMemo(() => {
    const filtered = filterKeyPoints(key_points ?? [])
    return filtered.slice(0, 3)
  }, [key_points])

  // 시험 유형
  const examType = recommendation.quick_stats?.exam_type || certificate.exam_info?.exam_type || null

  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 md:p-6 shadow-lg shadow-emerald-500/5 card-hover">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10" />
      <div className="relative space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            <div className="space-y-1.5 md:space-y-2 min-w-0">
              <Link href={`/certificates/${certificate.id}`} className="block group">
                <h3 className="text-lg md:text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {certificate.title}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-400">
                {certificate.categories.map((cat, idx) => (
                  <span key={idx} className="rounded-full bg-slate-800 px-2 py-0.5 md:py-1">{cat.name}</span>
                ))}
                {certificate.series && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 md:py-1">
                    {certificate.series}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 md:gap-2">
            <MatchScoreBadge score={matchScore} />
          </div>
        </div>

        {/* Quick Stats - 3개로 축소 */}
        <div className="grid gap-2 md:gap-3 grid-cols-3">
          <InfoChip
            icon={<TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-300" />}
            label="난이도"
            value={formatDifficulty(certificate.difficulty)}
          />
          <InfoChip
            icon={<Clock3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-300" />}
            label="준비 기간"
            value={formatStudyPeriod(effectiveDuration)}
          />
          <InfoChip
            icon={<FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300" />}
            label="시험 유형"
            value={examType || '정보 없음'}
          />
        </div>

        {/* Recommendation Reason - 간결하게 */}
        <div className="rounded-lg md:rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 md:p-4">
          <p className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-emerald-200">
            <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
            추천 이유
          </p>
          <p className="mt-1.5 md:mt-2 text-sm md:text-base leading-relaxed text-slate-50 line-clamp-3">
            {recommendation_reason}
          </p>
        </div>

        {/* Key Points - 최대 3개 */}
        {filteredKeyPoints.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm md:text-base font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              핵심 포인트
            </span>
            <ul className="space-y-1.5">
              {filteredKeyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm md:text-base text-slate-200"
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Study Insights - 최대 2개 */}
        {(recommendation.study_insights?.difficulty_feedback ||
          (recommendation.study_insights?.study_tips?.length ?? 0) > 0) && (
          <div className="rounded-lg md:rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 md:p-4">
            <p className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-cyan-200">
              <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4" />
              합격자 팁
            </p>
            <ul className="mt-2 space-y-1.5">
              {/* 난이도 피드백 (1개) */}
              {recommendation.study_insights?.difficulty_feedback && (
                <li className="text-sm md:text-base text-slate-200 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">📝</span>
                  <span className="line-clamp-2">{recommendation.study_insights.difficulty_feedback}</span>
                </li>
              )}
              {/* 학습 팁 (1개만) */}
              {recommendation.study_insights?.study_tips?.slice(0, 1).map((tip, i) => (
                <li key={`study-${i}`} className="text-sm md:text-base text-slate-200 flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span className="line-clamp-2">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="pt-1">
          <Button asChild className="w-full h-10 md:h-11 text-sm md:text-base bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
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
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-800/70 bg-slate-900/70 px-2 py-2 md:px-3 md:py-2.5">
      <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-md bg-slate-800/80">
        {icon}
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-[10px] md:text-xs text-slate-400">{label}</p>
        <p className="text-[11px] md:text-sm font-semibold text-white truncate max-w-[80px] md:max-w-[100px]">{value}</p>
      </div>
    </div>
  )
}
