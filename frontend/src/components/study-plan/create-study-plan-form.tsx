'use client'

/**
 * Create Study Plan Form Component
 * 
 * Form to create a new study plan for a certificate
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useCreateStudyPlan } from '@/hooks/use-study-plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, Calendar, Clock, Loader2 } from 'lucide-react'
import type { StudyPlanCreate } from '@/lib/api/types'

interface CreateStudyPlanFormProps {
  certificateId: string
  certificateTitle: string
  studyPeriodDays?: number | null
}

interface FormData {
  title: string
  target_date: string
  daily_study_hours: number
}

export function CreateStudyPlanForm({
  certificateId,
  certificateTitle,
  studyPeriodDays,
}: CreateStudyPlanFormProps) {
  const router = useRouter()
  const createMutation = useCreateStudyPlan()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      title: `${certificateTitle} 학습 계획`,
      daily_study_hours: 3,
      target_date: calculateDefaultTargetDate(studyPeriodDays),
    },
  })

  const dailyHours = watch('daily_study_hours')
  const targetDate = watch('target_date')

  const onSubmit = async (data: FormData) => {
    try {
      setError(null)

      const studyPlanData: StudyPlanCreate = {
        certificate_id: certificateId,
        title: data.title,
        target_date: data.target_date,
        daily_study_hours: data.daily_study_hours,
      }

      await createMutation.mutateAsync(studyPlanData)

      // Success - redirect to search (dashboard is disabled for now)
      router.push('/search')
    } catch (err) {
      setError(err instanceof Error ? err.message : '학습 계획 생성에 실패했습니다.')
    }
  }

  // Calculate estimated completion date
  const estimatedDays = targetDate
    ? Math.ceil(
        (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  const estimatedHours = estimatedDays * dailyHours

  return (
    <Card className="relative p-6 overflow-hidden" data-testid="study-plan-form">
      {createMutation.isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-background/95 p-6 shadow-lg">
            <div className="flex items-center justify-center">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Certificate Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{certificateTitle}</h3>
          <p className="text-sm text-muted-foreground">
            자격증 학습 계획을 생성합니다
          </p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            계획 제목
          </Label>
          <Input
            id="title"
            type="text"
            {...register('title', {
              required: '계획 제목을 입력해주세요.',
              minLength: {
                value: 3,
                message: '제목은 최소 3자 이상이어야 합니다.',
              },
              maxLength: {
                value: 100,
                message: '제목은 최대 100자까지 입력할 수 있습니다.',
              },
            })}
            className={errors.title ? 'border-destructive' : ''}
            placeholder="예: 정보처리기사 3개월 합격 계획"
          />
          {errors.title && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Target Date */}
        <div className="space-y-2">
          <Label htmlFor="target_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            목표 완료일
          </Label>
          <Input
            id="target_date"
            type="date"
            {...register('target_date', {
              required: '목표 완료일을 선택해주세요.',
              validate: (value) => {
                const selected = new Date(value)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                if (selected < today) {
                  return '목표일은 오늘 이후여야 합니다.'
                }
                return true
              },
            })}
            className={errors.target_date ? 'border-destructive' : ''}
          />
          {errors.target_date && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.target_date.message}
            </p>
          )}
          {studyPeriodDays && (
            <p className="text-xs text-muted-foreground">
              권장 준비기간: 약 {studyPeriodDays}일 ({Math.ceil(studyPeriodDays / 30)}개월)
            </p>
          )}
        </div>

        {/* Daily Study Hours */}
        <div className="space-y-2">
          <Label htmlFor="daily_study_hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            하루 학습 시간 (시간)
          </Label>
          <Input
            id="daily_study_hours"
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            {...register('daily_study_hours', {
              required: '하루 학습 시간을 입력해주세요.',
              min: {
                value: 0.5,
                message: '최소 0.5시간 이상이어야 합니다.',
              },
              max: {
                value: 12,
                message: '최대 12시간을 초과할 수 없습니다.',
              },
              valueAsNumber: true,
            })}
            className={errors.daily_study_hours ? 'border-destructive' : ''}
          />
          {errors.daily_study_hours && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.daily_study_hours.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            0.5 ~ 12 사이의 값을 입력하세요
          </p>
        </div>

        {/* Estimated Summary */}
        {targetDate && dailyHours > 0 && estimatedDays > 0 && (
          <Card className="p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">예상 학습량</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• 총 {estimatedDays}일 동안 학습</p>
              <p>• 예상 총 학습 시간: 약 {estimatedHours.toFixed(0)}시간</p>
              <p>• 주당 학습: {(dailyHours * 7).toFixed(1)}시간</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            학습 계획 생성
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            취소
          </Button>
        </div>
      </form>
    </Card>
  )
}

/**
 * Calculate default target date based on study period
 */
function calculateDefaultTargetDate(studyPeriodDays?: number | null): string {
  const today = new Date()
  const defaultDays = studyPeriodDays || 90 // Default 3 months
  const targetDate = new Date(today)
  targetDate.setDate(targetDate.getDate() + defaultDays)
  return targetDate.toISOString().split('T')[0]
}

