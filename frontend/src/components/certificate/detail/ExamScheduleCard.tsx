'use client'

import { Calendar, Clock, FileText, Bell } from 'lucide-react'
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
 * 연간 시험 횟수, CBT 여부, 다음 시험일 등을 표시합니다.
 */
export function ExamScheduleCard({ scheduleDetail, className }: ExamScheduleCardProps) {
  const hasAnyData =
    scheduleDetail.annual_exam_count !== null ||
    scheduleDetail.next_exam_date ||
    scheduleDetail.exam_type ||
    scheduleDetail.registration_period

  if (!hasAnyData) return null

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-cyan-400" />
          시험 일정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* 연간 시험 횟수 */}
          {scheduleDetail.annual_exam_count !== null && (
            <div className="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">연간 시험</span>
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

          {/* 다음 시험일 */}
          {scheduleDetail.next_exam_date && (
            <div className="col-span-2 bg-violet-900/10 rounded-lg p-4 border border-violet-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-slate-400">다음 시험일</span>
                  </div>
                  <span className="text-lg font-bold text-violet-400">
                    {scheduleDetail.next_exam_date}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 접수 기간 */}
          {scheduleDetail.registration_period && (
            <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
              <FileText className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">접수 기간</span>
                <span className="text-sm text-slate-300">{scheduleDetail.registration_period}</span>
              </div>
            </div>
          )}

          {/* 결과 발표일 */}
          {scheduleDetail.result_announcement && (
            <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">결과 발표</span>
                <span className="text-sm text-slate-300">{scheduleDetail.result_announcement}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
