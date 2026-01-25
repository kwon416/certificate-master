'use client'

import { Calendar, Clock, TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressCardProps {
  certificateTitle: string
  targetDate: string
  daysRemaining: number
  progressPercent: number
  currentPhase: string
  studyHoursToday: number
  studyHoursWeek: number
  streakDays: number
  velocityMetrics?: {
    status: 'ahead' | 'on-track' | 'behind' | 'critical'
    progressDelta: number
    predictedDate: string
  }
}

export function ProgressCard({
  certificateTitle,
  targetDate,
  daysRemaining,
  progressPercent,
  currentPhase,
  studyHoursToday,
  studyHoursWeek,
  streakDays,
  velocityMetrics,
}: ProgressCardProps) {
  const getEncouragementMessage = () => {
    if (progressPercent >= 80) return '거의 다 왔어요! 조금만 더! 🎉'
    if (progressPercent >= 50) return '절반 이상 진행! 훌륭해요! 💪'
    if (progressPercent >= 25) return '좋은 출발이에요! 계속 힘내세요! 🚀'
    return '지금 시작하세요! 화이팅! ✨'
  }

  const isOnTrack = progressPercent >= (100 - (daysRemaining / 90) * 100)

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">현재 학습 중</p>
            <CardTitle className="text-2xl font-bold text-white">
              {certificateTitle}
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">
              D-{daysRemaining}
            </div>
            <p className="text-sm text-slate-400">{targetDate} 목표</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">전체 진행도</span>
            <span className="text-lg font-semibold text-white">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-slate-700" />
          <div className="flex items-center justify-between text-sm">
            <span className={`flex items-center gap-1 ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
              <TrendingUp className="h-4 w-4" />
              {isOnTrack ? '계획대로 진행 중' : '조금 더 분발이 필요해요'}
            </span>
            <span className="text-slate-500">현재 단계: {currentPhase}</span>
          </div>
        </div>

        {/* Velocity Metrics */}
        {velocityMetrics && (
          <div
            className={cn(
              'p-3 rounded-xl border',
              velocityMetrics.status === 'ahead' && 'bg-emerald-500/10 border-emerald-500/20',
              velocityMetrics.status === 'on-track' && 'bg-cyan-500/10 border-cyan-500/20',
              velocityMetrics.status === 'behind' && 'bg-amber-500/10 border-amber-500/20',
              velocityMetrics.status === 'critical' && 'bg-red-500/10 border-red-500/20'
            )}
            data-testid="velocity-metrics-inline"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">진행 속도</span>
              <div className="flex items-center gap-2">
                {velocityMetrics.progressDelta >= 0 ? (
                  <TrendingUp
                    className={cn(
                      'h-4 w-4',
                      velocityMetrics.status === 'ahead' && 'text-emerald-400',
                      velocityMetrics.status === 'on-track' && 'text-cyan-400'
                    )}
                    data-testid="velocity-trend-up"
                  />
                ) : (
                  <TrendingDown
                    className={cn(
                      'h-4 w-4',
                      velocityMetrics.status === 'behind' && 'text-amber-400',
                      velocityMetrics.status === 'critical' && 'text-red-400'
                    )}
                    data-testid="velocity-trend-down"
                  />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    velocityMetrics.status === 'ahead' && 'text-emerald-400',
                    velocityMetrics.status === 'on-track' && 'text-cyan-400',
                    velocityMetrics.status === 'behind' && 'text-amber-400',
                    velocityMetrics.status === 'critical' && 'text-red-400'
                  )}
                  data-testid="velocity-delta-text"
                >
                  예상보다 {Math.abs(velocityMetrics.progressDelta).toFixed(1)}%{' '}
                  {velocityMetrics.progressDelta >= 0 ? '빠름' : '느림'}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">예상 완료일</span>
                <span className="text-slate-300 font-medium" data-testid="predicted-completion-date">
                  {new Date(velocityMetrics.predictedDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-800/50">
            <Clock className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{studyHoursToday}h</div>
            <p className="text-xs text-slate-500">오늘 학습</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/50">
            <Calendar className="h-5 w-5 text-violet-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{studyHoursWeek}h</div>
            <p className="text-xs text-slate-500">이번 주</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/50">
            <Flame className="h-5 w-5 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{streakDays}일</div>
            <p className="text-xs text-slate-500">연속 학습</p>
          </div>
        </div>

        {/* Encouragement */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-center text-emerald-400 font-medium">
            {getEncouragementMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

