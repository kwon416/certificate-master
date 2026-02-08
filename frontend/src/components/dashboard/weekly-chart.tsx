'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WeeklyData {
  day: string
  hours: number
}

interface WeeklyChartProps {
  data: WeeklyData[]
  targetHours?: number
}

export function WeeklyChart({ data, targetHours = 3 }: WeeklyChartProps) {
  const maxHours = Math.max(...data.map((d) => d.hours), targetHours)
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0)
  const avgHours = totalHours / data.length

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">주간 학습 현황</CardTitle>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{totalHours}시간</div>
            <p className="text-xs text-slate-500">평균 {avgHours.toFixed(1)}시간/일</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((item, index) => {
            const heightPercent = (item.hours / maxHours) * 100
            const isToday = index === data.length - 1
            const metTarget = item.hours >= targetHours

            return (
              <div
                key={item.day}
                className="flex flex-col items-center flex-1"
              >
                {/* Bar Container */}
                <div className="relative w-full flex flex-col items-center justify-end h-24">
                  {/* Target Line */}
                  {index === 0 && (
                    <div
                      className="absolute w-[calc(100%*7+24px)] left-0 border-t border-dashed border-slate-600"
                      style={{
                        bottom: `${(targetHours / maxHours) * 100}%`,
                      }}
                    >
                      <span className="absolute -right-12 -top-2.5 text-xs text-slate-500">
                        목표
                      </span>
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    className={cn(
                      'w-full max-w-8 rounded-t-md transition-[height] duration-500',
                      isToday
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : metTarget
                        ? 'bg-emerald-500/60'
                        : 'bg-slate-700'
                    )}
                    style={{
                      height: `${Math.max(heightPercent, 4)}%`,
                    }}
                  />

                  {/* Hours Label */}
                  {item.hours > 0 && (
                    <span
                      className={cn(
                        'absolute text-xs font-medium',
                        isToday ? 'text-emerald-400' : 'text-slate-400'
                      )}
                      style={{
                        bottom: `${Math.max(heightPercent, 4) + 4}%`,
                      }}
                    >
                      {item.hours}h
                    </span>
                  )}
                </div>

                {/* Day Label */}
                <span
                  className={cn(
                    'text-xs mt-2',
                    isToday ? 'text-emerald-400 font-medium' : 'text-slate-500'
                  )}
                >
                  {item.day}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

