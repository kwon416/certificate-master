'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  week: string
  title: string
  description: string
  progress: number
  status: 'completed' | 'in-progress' | 'locked'
}

interface StudyTimelineProps {
  milestones: Milestone[]
}

export function StudyTimeline({ milestones }: StudyTimelineProps) {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="text-foreground">학습 계획 타임라인</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {milestones.map((milestone, index) => {
            const isLast = index === milestones.length - 1

            return (
              <div key={milestone.id} className="relative flex gap-4">
                {/* Timeline Line & Dot */}
                <div className="flex flex-col items-center">
                  {/* Dot */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0',
                      milestone.status === 'completed'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : milestone.status === 'in-progress'
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-muted border-border'
                    )}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : milestone.status === 'in-progress' ? (
                      <Circle className="h-5 w-5 text-cyan-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 min-h-12',
                        milestone.status === 'completed'
                          ? 'bg-emerald-500/50'
                          : 'bg-border'
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 pb-8',
                    milestone.status === 'locked' && 'opacity-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium px-2 py-0.5 rounded',
                        milestone.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : milestone.status === 'in-progress'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {milestone.week}
                    </span>
                  </div>
                  <h4 className="text-foreground font-medium mb-1">
                    {milestone.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {milestone.description}
                  </p>

                  {/* Progress Bar */}
                  {milestone.status !== 'locked' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">진행도</span>
                        <span
                          className={cn(
                            milestone.status === 'completed'
                              ? 'text-emerald-400'
                              : 'text-cyan-400'
                          )}
                        >
                          {milestone.progress}%
                        </span>
                      </div>
                      <Progress
                        value={milestone.progress}
                        className="h-2 bg-border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

