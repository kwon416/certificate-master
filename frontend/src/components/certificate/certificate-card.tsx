'use client'

import Link from 'next/link'
import { Star, Clock, TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CategoryInfo } from '@/lib/api/types'

interface CertificateCardProps {
  id: string
  slug?: string
  title: string
  categories: CategoryInfo[]
  difficulty: number | null
  passRate: number | null
  studyPeriod: number | null
  overview: string | null
  variant?: 'grid' | 'list'
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
              : 'text-muted-foreground/50'
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

// 모듈 레벨 상수 (Vercel Best Practice: rendering-hoist-jsx, js-cache-function-results)
// 매 렌더마다 재생성되지 않도록 함수 외부로 호이스팅
const ICON_MAP: Record<string, string> = {
  // IT / 정보통신
  'IT': '💻', '정보통신': '💻', '정보기술': '💻', '소프트웨어': '💻',
  // 건설 / 건축
  '건설': '🏗️', '건축': '🏗️', '토목': '🏗️',
  // 전기 / 전자
  '전기': '⚡', '전자': '⚡', '전기전자': '⚡',
  // 기계 / 금속 / 재료
  '기계': '⚙️', '금속': '⚙️', '재료': '⚙️',
  // 보건 / 의료
  '보건': '🏥', '의료': '🏥', '간호': '🏥', '위생': '🏥',
  // 안전 / 환경
  '안전': '🛡️', '환경': '🌿', '안전관리': '🛡️', '소방': '🛡️',
  // 경영 / 회계 / 사무
  '경영': '📊', '회계': '📊', '세무': '📊', '세무/회계': '📊', '사무': '📊',
  // 금융 / 부동산
  '금융': '💰', '부동산': '🏠',
  // 교육 / 사회 / 교양
  '교육': '📚', '사회': '📚', '교양': '📚',
  // 화학 / 에너지
  '화학': '🧪', '에너지': '🔋',
  // 농림 / 식품
  '농림': '🌾', '식품': '🍽️', '조리': '🍽️',
  // 디자인 / 예술
  '디자인': '🎨', '예술': '🎨', '영상': '🎬',
  // 자격 등급
  '기술사': '🏆', '기능장': '🏆', '기사': '📋', '산업기사': '🏭', '기능사': '🔧',
  // 자격구분명 (API 데이터에서 나오는 실제 분류)
  '국가기술자격': '🏅', '국가전문자격': '🎯', '과정평가형자격': '📝',
  '국가자격': '🏅', '민간자격': '📄', '공인자격': '✅',
}

// partial match용 소문자 키 배열 (한 번만 생성)
const ICON_ENTRIES = Object.entries(ICON_MAP).map(
  ([key, icon]) => [key.toLowerCase(), icon] as const
)

function getCategoryIcon(category: string): string {
  // Try exact match first, then partial match
  if (ICON_MAP[category]) return ICON_MAP[category]
  const lowerCat = category.toLowerCase()
  for (const [key, icon] of ICON_ENTRIES) {
    if (lowerCat.includes(key) || key.includes(lowerCat)) {
      return icon
    }
  }
  return '📜'
}

interface CategoryColor {
  bg: string
  border: string
  text: string
  accent: string
  shadow: string
}

const COLOR_MAP: Record<string, CategoryColor> = {
  // IT / 정보통신 → cyan
  'IT': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', accent: 'bg-cyan-500', shadow: 'hover:shadow-cyan-500/20' },
  '정보통신': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', accent: 'bg-cyan-500', shadow: 'hover:shadow-cyan-500/20' },
  '정보기술': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', accent: 'bg-cyan-500', shadow: 'hover:shadow-cyan-500/20' },
  '소프트웨어': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', accent: 'bg-cyan-500', shadow: 'hover:shadow-cyan-500/20' },
  // 건설 / 건축 → amber
  '건설': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500', shadow: 'hover:shadow-amber-500/20' },
  '건축': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500', shadow: 'hover:shadow-amber-500/20' },
  '토목': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500', shadow: 'hover:shadow-amber-500/20' },
  // 전기 / 전자 → yellow
  '전기': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', accent: 'bg-yellow-500', shadow: 'hover:shadow-yellow-500/20' },
  '전자': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', accent: 'bg-yellow-500', shadow: 'hover:shadow-yellow-500/20' },
  '전기전자': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', accent: 'bg-yellow-500', shadow: 'hover:shadow-yellow-500/20' },
  // 기계 / 금속 → slate
  '기계': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-muted-foreground', accent: 'bg-slate-500', shadow: 'hover:shadow-slate-500/20' },
  '금속': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-muted-foreground', accent: 'bg-slate-500', shadow: 'hover:shadow-slate-500/20' },
  '재료': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-muted-foreground', accent: 'bg-slate-500', shadow: 'hover:shadow-slate-500/20' },
  // 보건 / 의료 → rose
  '보건': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', accent: 'bg-rose-500', shadow: 'hover:shadow-rose-500/20' },
  '의료': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', accent: 'bg-rose-500', shadow: 'hover:shadow-rose-500/20' },
  '간호': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', accent: 'bg-rose-500', shadow: 'hover:shadow-rose-500/20' },
  '위생': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', accent: 'bg-rose-500', shadow: 'hover:shadow-rose-500/20' },
  // 안전 / 환경 → green
  '안전': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', accent: 'bg-green-500', shadow: 'hover:shadow-green-500/20' },
  '환경': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', accent: 'bg-green-500', shadow: 'hover:shadow-green-500/20' },
  '안전관리': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', accent: 'bg-green-500', shadow: 'hover:shadow-green-500/20' },
  '소방': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', accent: 'bg-green-500', shadow: 'hover:shadow-green-500/20' },
  // 경영 / 회계 → violet
  '경영': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500', shadow: 'hover:shadow-violet-500/20' },
  '회계': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500', shadow: 'hover:shadow-violet-500/20' },
  '세무': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500', shadow: 'hover:shadow-violet-500/20' },
  '세무/회계': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500', shadow: 'hover:shadow-violet-500/20' },
  '사무': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500', shadow: 'hover:shadow-violet-500/20' },
  // 금융 → indigo
  '금융': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', accent: 'bg-indigo-500', shadow: 'hover:shadow-indigo-500/20' },
  '부동산': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', accent: 'bg-indigo-500', shadow: 'hover:shadow-indigo-500/20' },
  // 교육 / 사회 → blue
  '교육': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500', shadow: 'hover:shadow-blue-500/20' },
  '사회': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500', shadow: 'hover:shadow-blue-500/20' },
  '교양': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500', shadow: 'hover:shadow-blue-500/20' },
  // 화학 / 에너지 → orange
  '화학': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600 dark:text-orange-400', accent: 'bg-orange-500', shadow: 'hover:shadow-orange-500/20' },
  '에너지': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600 dark:text-orange-400', accent: 'bg-orange-500', shadow: 'hover:shadow-orange-500/20' },
  // 농림 / 식품 → lime
  '농림': { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-600 dark:text-lime-400', accent: 'bg-lime-500', shadow: 'hover:shadow-lime-500/20' },
  '식품': { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-600 dark:text-lime-400', accent: 'bg-lime-500', shadow: 'hover:shadow-lime-500/20' },
  '조리': { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-600 dark:text-lime-400', accent: 'bg-lime-500', shadow: 'hover:shadow-lime-500/20' },
  // 디자인 / 예술 → pink
  '디자인': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600 dark:text-pink-400', accent: 'bg-pink-500', shadow: 'hover:shadow-pink-500/20' },
  '예술': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600 dark:text-pink-400', accent: 'bg-pink-500', shadow: 'hover:shadow-pink-500/20' },
  '영상': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600 dark:text-pink-400', accent: 'bg-pink-500', shadow: 'hover:shadow-pink-500/20' },
  // 자격구분명 (API 데이터에서 나오는 실제 분류)
  '국가기술자격': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500', shadow: 'hover:shadow-emerald-500/20' },
  '국가전문자격': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', accent: 'bg-cyan-500', shadow: 'hover:shadow-cyan-500/20' },
  '과정평가형자격': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500', shadow: 'hover:shadow-amber-500/20' },
  '국가자격': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500', shadow: 'hover:shadow-emerald-500/20' },
  '민간자격': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-muted-foreground', accent: 'bg-slate-400', shadow: 'hover:shadow-slate-500/20' },
  '공인자격': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500', shadow: 'hover:shadow-blue-500/20' },
}

const DEFAULT_COLOR: CategoryColor = { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500', shadow: 'hover:shadow-emerald-500/20' }

// partial match용 키 배열 (한 번만 생성)
const COLOR_ENTRIES = Object.entries(COLOR_MAP)

function getCategoryColor(category: string): CategoryColor {
  if (COLOR_MAP[category]) return COLOR_MAP[category]
  // Partial match
  for (const [key, color] of COLOR_ENTRIES) {
    if (category.includes(key) || key.includes(category)) {
      return color
    }
  }
  return DEFAULT_COLOR
}

export function CertificateCard({
  id,
  slug,
  title,
  categories,
  difficulty,
  passRate,
  studyPeriod,
  overview,
  variant = 'grid',
}: CertificateCardProps) {
  // 첫 번째 카테고리를 기본으로 사용 (아이콘 등)
  const primaryCategory = categories[0]?.name || '기타'
  const isListView = variant === 'list'
  const categoryColor = getCategoryColor(primaryCategory)
  const linkHref = `/certificates/${slug || id}`

  return (
    <Card
      data-testid="certificate-card"
      className={cn(
        'group relative bg-card border-border transition-[transform,box-shadow] duration-300 overflow-hidden',
        'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl',
        categoryColor.shadow,
        `hover:${categoryColor.border}`
      )}
    >
      <Link href={linkHref}>
        <CardContent className={cn(isListView ? 'p-4' : 'p-6', 'relative')}>
          {/* Category accent bar */}
          <div
            data-testid="category-accent"
            className={cn(
              'absolute',
              isListView
                ? 'left-0 top-0 bottom-0 w-[3px] rounded-l'
                : 'top-0 left-0 right-0 h-[2px] rounded-t',
              categoryColor.accent
            )}
          />
          {isListView ? (
            /* List View - Compact Layout */
            <div className="flex items-center gap-3 pl-2">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">{getCategoryIcon(primaryCategory)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-7">
                {/* Title - 항상 한 줄, truncate */}
                <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate leading-snug">
                  {title}
                </h3>

                {/* Categories - 타이틀 아래 고정 줄 */}
                <div className="flex flex-wrap gap-1 mt-0.5 mb-1">
                  {categories.slice(0, 2).map((cat, idx) => {
                    const catColor = getCategoryColor(cat.name)
                    return (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={cn('text-xs font-medium border', catColor.bg, catColor.border, catColor.text)}
                      >
                        {cat.name}
                      </Badge>
                    )
                  })}
                </div>

                {/* Stats - 좁아지면 두 줄로 자연스럽게 래핑 (• 구분자 제거) */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                  {difficulty !== null && (
                    <div className="flex items-center gap-1.5">
                      <DifficultyStars level={difficulty} />
                      <span className="text-xs text-muted-foreground">
                        {getDifficultyLabel(difficulty)}
                      </span>
                    </div>
                  )}
                  {passRate !== null && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {(passRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {studyPeriod !== null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs text-foreground/80">
                        {getStudyPeriodLabel(studyPeriod)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow indicator */}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </div>
          ) : (
            /* Grid View - Original Layout */
            <>
              {/* Icon & Category */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{getCategoryIcon(primaryCategory)}</div>
              </div>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {categories.map((cat, idx) => {
                  const catColor = getCategoryColor(cat.name)
                  return (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className={cn('text-xs font-medium border', catColor.bg, catColor.border, catColor.text)}
                    >
                      {cat.name}
                    </Badge>
                  )
                })}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                {title}
              </h3>

              {/* Overview */}
              {overview && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                  {overview}
                </p>
              )}

              {/* Stats - Chip style */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {/* Difficulty */}
                {difficulty !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <DifficultyStars level={difficulty} />
                    <span className="text-xs text-muted-foreground">
                      {getDifficultyLabel(difficulty)}
                    </span>
                  </div>
                )}

                {/* Pass Rate */}
                {passRate !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {(passRate * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                {/* Study Period */}
                {studyPeriod !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs text-foreground/80">
                      {getStudyPeriodLabel(studyPeriod)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
