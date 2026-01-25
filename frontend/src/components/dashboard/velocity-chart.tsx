'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VelocityMetrics } from '@/hooks/use-velocity-metrics'

interface VelocityChartProps {
  metrics: VelocityMetrics
}

/**
 * Velocity Chart Component
 *
 * Displays study plan velocity metrics including:
 * - Progress rate indicator (ahead/behind)
 * - Expected vs actual progress comparison
 * - Predicted completion date
 * - Visual status indicator with color coding
 *
 * @example
 * ```tsx
 * const { data: metrics } = useVelocityMetrics(planId)
 *
 * {metrics && <VelocityChart metrics={metrics} />}
 * ```
 */
export function VelocityChart({ metrics }: VelocityChartProps) {
  const { expected_progress, actual_progress, progress_delta, status, predicted_date } = metrics

  // Determine status colors
  const statusColors = {
    ahead: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      icon: TrendingUp,
    },
    'on-track': {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      icon: TrendingUp,
    },
    behind: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: TrendingDown,
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: TrendingDown,
    },
  }

  const { bg, border, text, icon: TrendIcon } = statusColors[status]

  const statusLabels = {
    ahead: '빠름',
    'on-track': '정상',
    behind: '느림',
    critical: '주의',
  }

  // Format predicted date to Korean format
  const formatPredictedDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return isoDate
    }
  }

  return (
    <Card data-testid="velocity-chart" className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">진행 속도 추이</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Velocity Status Indicator */}
        <div
          className={cn(
            'p-4 rounded-xl border',
            bg,
            border
          )}
          data-testid="velocity-indicator"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">진행 속도</span>
            <div className="flex items-center gap-2">
              <TrendIcon className={cn('h-5 w-5', text)} data-testid="velocity-trend-icon" />
              <span className={cn('text-lg font-bold', text)}>
                예상보다 {Math.abs(progress_delta).toFixed(1)}% {statusLabels[status]}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">예상 진행률</p>
            <p className="text-2xl font-bold text-slate-300" data-testid="expected-progress">
              {expected_progress.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">실제 진행률</p>
            <p className="text-2xl font-bold text-white" data-testid="actual-progress">
              {actual_progress.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Predicted Completion Date */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-1">예상 완료일</p>
          <p className="text-lg font-medium text-white" data-testid="predicted-date">
            {formatPredictedDate(predicted_date)}
          </p>
        </div>

        {/* Hidden value for testing */}
        <div className="hidden" data-testid="velocity-value">
          {metrics.velocity}
        </div>
      </CardContent>
    </Card>
  )
}
