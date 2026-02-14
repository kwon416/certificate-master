'use client'

import { Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExamScheduleDetail } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface ExamScheduleCardProps {
  scheduleDetail: ExamScheduleDetail
  className?: string
}

/**
 * ExamScheduleCard - 시험 일정 정보 카드
 *
 * 연간 시험 횟수, CBT 여부를 표시합니다.
 * Note: 다음 시험일, 접수 기간, 결과 발표는 만료될 수 있어 표시하지 않음
 */
export function ExamScheduleCard({ scheduleDetail, className }: ExamScheduleCardProps) {
  // 연간 시험 횟수 또는 시험 타입이 있을 때만 표시
  const hasAnyData =
    scheduleDetail.annual_exam_count !== null ||
    scheduleDetail.exam_type

  if (!hasAnyData) return null

  return (
    <Card className={cn('bg-card/50 border-border', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-cyan-400" />
          시험 일정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {/* 연간 시험 횟수 */}
          {scheduleDetail.annual_exam_count !== null && (
            <div className="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">연간 시험</span>
              </div>
              <span className="text-xl font-bold text-cyan-400">
                {scheduleDetail.annual_exam_count}회
              </span>
              {scheduleDetail.exam_type && (
                <Badge variant="outline" className="ml-2 text-xs border-cyan-500/30 text-cyan-400">
                  {scheduleDetail.exam_type}
                </Badge>
              )}
            </div>
          )}

          {/* 시험 타입만 있는 경우 */}
          {scheduleDetail.annual_exam_count === null && scheduleDetail.exam_type && (
            <div className="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">시험 방식</span>
              </div>
              <Badge variant="outline" className="text-sm border-cyan-500/30 text-cyan-400">
                {scheduleDetail.exam_type}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
