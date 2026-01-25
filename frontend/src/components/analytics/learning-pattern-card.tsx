'use client'

import { Sun, Moon, Cloud, Sunset, TrendingUp, TrendingDown, Minus, Clock, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { LearningPattern } from '@/lib/api/types'

interface LearningPatternCardProps {
  pattern: LearningPattern
}

// Time slot icons
const timeSlotIcons: Record<string, typeof Sun> = {
  '오전': Sun,
  '오후': Cloud,
  '저녁': Sunset,
  '새벽': Moon,
}

// Mood trend icons and colors
const moodTrendConfig = {
  improving: { icon: TrendingUp, label: '개선 중', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  stable: { icon: Minus, label: '안정적', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  declining: { icon: TrendingDown, label: '하락', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

// Mood emoji mapping
const moodEmojis: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  tired: '😴',
  stressed: '😰',
}

export function LearningPatternCard({ pattern }: LearningPatternCardProps) {
  const trendData = moodTrendConfig[pattern.mood_trend]
  const TrendIcon = trendData.icon

  // Get consistency score color
  const getConsistencyColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-400 mb-1">학습 패턴 분석</p>
            <CardTitle className="text-2xl font-bold text-white">
              학습 습관 인사이트
            </CardTitle>
          </div>
          <Badge className={cn('text-sm font-medium border', trendData.color)}>
            <TrendIcon className="h-4 w-4 mr-1" />
            기분 {trendData.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Preferred Time Slots */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            선호 학습 시간대
          </h4>
          <div className="flex flex-wrap gap-2">
            {pattern.preferred_time_slots.length > 0 ? (
              pattern.preferred_time_slots.map((slot) => {
                const Icon = timeSlotIcons[slot] || Clock
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  >
                    <Icon className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-100">{slot}</span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-400">데이터를 수집 중입니다</p>
            )}
          </div>
        </div>

        {/* Average Session Duration */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-400" />
              <span className="text-sm text-slate-400">평균 학습 시간</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {pattern.average_session_duration.toFixed(1)}시간
            </span>
          </div>
        </div>

        {/* Weekday Efficiency */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            요일별 효율
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {pattern.best_weekday && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-slate-400 mb-1">가장 효율적</p>
                <p className="text-lg font-semibold text-emerald-100">{pattern.best_weekday}</p>
              </div>
            )}
            {pattern.worst_weekday && (
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <p className="text-xs text-slate-400 mb-1">개선 필요</p>
                <p className="text-lg font-semibold text-slate-300">{pattern.worst_weekday}</p>
              </div>
            )}
          </div>
        </div>

        {/* Consistency Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              학습 일관성 점수
            </h4>
            <span className={cn('text-2xl font-bold', getConsistencyColor(pattern.consistency_score))}>
              {pattern.consistency_score.toFixed(0)}/100
            </span>
          </div>
          <Progress
            value={pattern.consistency_score}
            className="h-3 bg-slate-700"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {pattern.consistency_score >= 70
                ? '매우 일관적인 학습 패턴입니다! 💪'
                : pattern.consistency_score >= 40
                ? '조금 더 일정하게 학습해보세요 📚'
                : '학습 시간을 규칙적으로 만들어보세요 ⏰'}
            </span>
          </div>
        </div>

        {/* Recent Moods */}
        {pattern.recent_moods.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">최근 7일 기분 추이</h4>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
              {pattern.recent_moods.slice(0, 7).map((mood, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl mb-1">{moodEmojis[mood] || '😐'}</div>
                  <div className="text-xs text-slate-500">
                    {['월', '화', '수', '목', '금', '토', '일'][
                      (new Date().getDay() - pattern.recent_moods.length + index + 7) % 7
                    ]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
          <h4 className="text-sm font-medium text-slate-200 mb-2">💡 인사이트</h4>
          <ul className="space-y-1 text-sm text-slate-300">
            {pattern.preferred_time_slots.length > 0 && (
              <li>
                • {pattern.preferred_time_slots[0]} 시간대에 집중력이 가장 높아요
              </li>
            )}
            {pattern.best_weekday && (
              <li>• {pattern.best_weekday}에 가장 효율적으로 학습하고 있어요</li>
            )}
            {pattern.consistency_score >= 70 && (
              <li>• 일관성 있는 학습으로 목표 달성 가능성이 높아요</li>
            )}
            {pattern.mood_trend === 'improving' && (
              <li>• 최근 학습 만족도가 높아지고 있어요 👍</li>
            )}
            {pattern.mood_trend === 'declining' && (
              <li className="text-amber-300">• 번아웃에 주의하세요. 휴식도 중요해요 ⚠️</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
