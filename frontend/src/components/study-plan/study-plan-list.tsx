'use client'

/**
 * Study Plan List Component
 * 
 * Displays study plan cards for the current user
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Trash2, Play, Pause, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { StudyPlan } from '@/lib/api/types'

interface StudyPlanListProps {
  plans: StudyPlan[]
  onDelete?: (id: string, title: string) => void
  isDeleting?: boolean
}

export function StudyPlanList({ plans, onDelete, isDeleting }: StudyPlanListProps) {
  if (!plans || plans.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">학습 계획이 없습니다.</p>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><Play className="h-3 w-3 mr-1" />진행 중</Badge>
      case 'paused':
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />일시 중지</Badge>
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />완료</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const calculateProgress = (milestones: Array<{ completed: boolean }>) => {
    if (milestones.length === 0) return 0
    const completed = milestones.filter(m => m.completed).length
    return Math.round((completed / milestones.length) * 100)
  }

  return (
    <div className="grid gap-4">
      {plans.map((plan) => {
        const progress = calculateProgress(plan.milestones)
        const completedMilestones = plan.milestones.filter(m => m.completed).length

        return (
          <Card key={plan.id} className="p-6 hover:shadow-md transition-shadow" data-testid="study-plan-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {plan.title}
                  </h3>
                  {getStatusBadge(plan.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>목표: {new Date(plan.target_date).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>

              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(plan.id, plan.title)}
                  disabled={isDeleting}
                  aria-label="삭제"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completedMilestones} / {plan.milestones.length} 마일스톤 완료
              </p>
            </div>

            {/* Milestones Preview */}
            {plan.milestones.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium mb-2">마일스톤</p>
                {plan.milestones.slice(0, 3).map((milestone) => (
                  <div key={milestone.week} className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-4 w-4 ${
                        milestone.completed ? 'text-green-500' : 'text-gray-300'
                      }`}
                    />
                    <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                      {milestone.week}주차: {milestone.title}
                    </span>
                  </div>
                ))}
                {plan.milestones.length > 3 && (
                  <p className="text-xs text-muted-foreground ml-6">
                    +{plan.milestones.length - 3}개 더보기
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t flex gap-2">
              <Link href={`/study-plans/${plan.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  상세 보기
                </Button>
              </Link>
              {plan.certificate_id && (
                <Link href={`/certificates/${plan.certificate?.slug || plan.certificate_id}`}>
                  <Button variant="ghost">자격증 정보</Button>
                </Link>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

