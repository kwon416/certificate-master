'use client'

import { TrendingUp, Flame, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProgressAnalytics, LearnerStatus, ReviewUrgency } from '@/lib/api/types'

interface ProgressAnalyticsCardProps {
  analytics: ProgressAnalytics
  certificateTitle?: string
}

// Status color mapping
const statusConfig: Record<LearnerStatus, { label: string; color: string; icon: typeof TrendingUp }> = {
  exceeding: { label: '초과 달성', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
  on_track: { label: '정상 진행', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: CheckCircle2 },
  needs_attention: { label: '주의 필요', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
  at_risk: { label: '이탈 위험', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertTriangle },
}

// Review urgency mapping
const urgencyConfig: Record<ReviewUrgency, { label: string; color: string }> = {
  low: { label: '여유', color: 'text-muted-foreground' },
  medium: { label: '보통', color: 'text-amber-400' },
  high: { label: '긴급', color: 'text-red-400' },
}

export function ProgressAnalyticsCard({ analytics, certificateTitle }: ProgressAnalyticsCardProps) {
  const statusData = statusConfig[analytics.status]
  const StatusIcon = statusData.icon
  const urgencyData = urgencyConfig[analytics.review_urgency]

  return (
    <Card className="bg-gradient-to-br from-card to-muted border-border overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">진행도 분석</p>
            <CardTitle className="text-2xl font-bold text-foreground">
              {certificateTitle || '학습 계획 분석'}
            </CardTitle>
          </div>
          <Badge className={cn('text-sm font-medium border', statusData.color)}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusData.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Completion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">진도율</span>
              <span className="text-lg font-semibold text-foreground">
                {analytics.completion_rate.toFixed(1)}%
              </span>
            </div>
            <Progress value={analytics.completion_rate} className="h-2 bg-border" />
          </div>

          {/* Time Adherence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">시간 이행률</span>
              <span className="text-lg font-semibold text-foreground">
                {analytics.time_adherence_rate.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(analytics.time_adherence_rate, 100)}
              className="h-2 bg-border"
            />
          </div>

          {/* Schedule Adherence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">일정 준수율</span>
              <span className="text-lg font-semibold text-foreground">
                {analytics.schedule_adherence_rate.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(analytics.schedule_adherence_rate, 100)}
              className="h-2 bg-border"
            />
          </div>

          {/* Current Streak */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-sm text-muted-foreground">연속 학습</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{analytics.current_streak}일</span>
          </div>
        </div>

        {/* Learning Pattern Score & Review Urgency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">학습 패턴</span>
              <span className="text-lg font-semibold text-foreground">
                {analytics.learning_pattern_score.toFixed(0)}/100
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">복습 긴급도</span>
              <span className={cn('text-lg font-semibold', urgencyData.color)}>
                {urgencyData.label}
              </span>
            </div>
          </div>
        </div>

        {/* Predicted Completion Date */}
        {analytics.predicted_completion_date && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-muted-foreground">예상 완료일</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {new Date(analytics.predicted_completion_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {/* Risk Signals */}
        {analytics.risk_signals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              위험 신호
            </h4>
            <div className="space-y-2">
              {analytics.risk_signals.map((signal, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    signal.severity === 'high' && 'bg-red-500/10 border-red-500/20',
                    signal.severity === 'medium' && 'bg-amber-500/10 border-amber-500/20',
                    signal.severity === 'low' && 'bg-border/50 border-border'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 mt-0.5',
                        signal.severity === 'high' && 'text-red-400',
                        signal.severity === 'medium' && 'text-amber-400',
                        signal.severity === 'low' && 'text-muted-foreground'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{signal.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(signal.detected_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analytics.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              추천 액션
            </h4>
            <div className="space-y-2">
              {analytics.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <p className="text-sm text-emerald-100">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
