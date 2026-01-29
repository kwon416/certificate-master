'use client'

import { Star, FileText, Wrench, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DifficultyBreakdown as DifficultyBreakdownType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface DifficultyBreakdownProps {
  difficulty: DifficultyBreakdownType
  className?: string
}

function DifficultyBar({
  label,
  icon: Icon,
  value,
  textColorClass,
  bgColorClass,
}: {
  label: string
  icon: React.ElementType
  value: number | null
  textColorClass: string
  bgColorClass: string
}) {
  if (value === null) return null

  // 5점 만점 기준 비율 계산
  const percentage = (value / 5) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', textColorClass)} />
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-3.5 w-3.5',
                star <= value ? `fill-current ${textColorClass}` : 'text-slate-700'
              )}
            />
          ))}
          <span className="text-sm text-slate-400 ml-2">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', bgColorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * DifficultyBreakdown - 난이도 세분화 차트
 *
 * 필기, 실기, 면접 등 시험 유형별 난이도를 시각화합니다.
 */
export function DifficultyBreakdown({ difficulty, className }: DifficultyBreakdownProps) {
  const hasDetailedData =
    difficulty.written !== null ||
    difficulty.practical !== null ||
    difficulty.interview !== null

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-amber-400" />
          난이도 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 전체 난이도 */}
        <div className="mb-6 p-4 bg-amber-900/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">전체 난이도</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-5 w-5',
                    star <= difficulty.overall
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  )}
                />
              ))}
              <span className="text-lg font-bold text-amber-400 ml-2">
                {difficulty.overall.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {difficulty.overall <= 2
              ? '비교적 쉬운 난이도로 단기간 합격이 가능합니다.'
              : difficulty.overall <= 3
              ? '적정 난이도로 꾸준한 학습이 필요합니다.'
              : difficulty.overall <= 4
              ? '높은 난이도로 체계적인 학습 계획이 필요합니다.'
              : '최상위 난이도로 전문적인 준비가 필수입니다.'}
          </p>
        </div>

        {/* 세부 난이도 */}
        {hasDetailedData && (
          <div className="space-y-4">
            <DifficultyBar
              label="필기시험"
              icon={FileText}
              value={difficulty.written}
              textColorClass="text-cyan-400"
              bgColorClass="bg-cyan-400"
            />
            <DifficultyBar
              label="실기시험"
              icon={Wrench}
              value={difficulty.practical}
              textColorClass="text-emerald-400"
              bgColorClass="bg-emerald-400"
            />
            <DifficultyBar
              label="면접"
              icon={Users}
              value={difficulty.interview}
              textColorClass="text-violet-400"
              bgColorClass="bg-violet-400"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
