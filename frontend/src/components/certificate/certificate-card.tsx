'use client'

import Link from 'next/link'
import { Star, Clock, Heart, TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CategoryInfo } from '@/lib/api/types'

interface CertificateCardProps {
  id: string
  title: string
  categories: CategoryInfo[]
  difficulty: number | null
  passRate: number | null
  studyPeriod: number | null
  overview: string | null
  isFavorite?: boolean
  onFavoriteToggle?: (id: string) => void
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= level
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-600'
          )}
        />
      ))}
    </div>
  )
}

function getDifficultyLabel(level: number): string {
  if (level <= 1) return '매우 쉬움'
  if (level <= 2) return '쉬움'
  if (level <= 3) return '보통'
  if (level <= 4) return '어려움'
  return '매우 어려움'
}

function getStudyPeriodLabel(days: number): string {
  const months = Math.max(1, Math.round(days / 30))
  return `약 ${months}개월`
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'IT': '💻',
    '정보통신': '💻',
    '세무/회계': '📊',
    '금융': '💰',
    '부동산': '🏠',
    '교양': '📚',
    '기술사': '⚙️',
    '기능사': '🔧',
    '기사': '📋',
    '산업기사': '🏭',
  }
  return iconMap[category] || '📜'
}

export function CertificateCard({
  id,
  title,
  categories,
  difficulty,
  passRate,
  studyPeriod,
  overview,
  isFavorite = false,
  onFavoriteToggle,
}: CertificateCardProps) {
  // 첫 번째 카테고리를 기본으로 사용 (아이콘 등)
  const primaryCategory = categories[0]?.name || '기타'
  return (
    <Card className="group relative bg-slate-900/50 border-slate-800/50 hover:border-emerald-500/30 transition-all duration-300 card-hover overflow-hidden">
      {/* Favorite Button */}
      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFavoriteToggle(id)
          }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isFavorite
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-400 hover:text-rose-400'
            )}
          />
        </button>
      )}

      <Link href={`/certificates/${id}`}>
        <CardContent className="p-6">
          {/* Icon & Category */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">{getCategoryIcon(primaryCategory)}</div>
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map((cat, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-slate-800 text-slate-300 text-xs font-medium"
              >
                {cat.name}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Overview */}
          {overview && (
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
              {overview}
            </p>
          )}

          {/* Stats */}
          <div className="space-y-3 pt-4 border-t border-slate-800/50">
            {/* Difficulty */}
            {difficulty !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">난이도</span>
                <div className="flex items-center gap-2">
                  <DifficultyStars level={difficulty} />
                  <span className="text-xs text-slate-400">
                    {getDifficultyLabel(difficulty)}
                  </span>
                </div>
              </div>
            )}

            {/* Pass Rate */}
            {passRate !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">합격률</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    {(passRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* Study Period */}
            {studyPeriod !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">준비기간</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-sm text-slate-300">
                    {getStudyPeriodLabel(studyPeriod)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* View More */}
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <Button
              variant="ghost"
              className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              상세보기
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
