'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { useCreateCheckin, useTodayCheckin, useUpdateCheckin } from '@/hooks/use-checkins'
import type { MoodType } from '@/lib/api/types'
import { AIEncouragement } from './ai-encouragement'

const moodOptions: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🤩', label: '최고' },
  { value: 'good', emoji: '😊', label: '좋음' },
  { value: 'okay', emoji: '😐', label: '보통' },
  { value: 'tired', emoji: '😴', label: '피곤' },
  { value: 'stressed', emoji: '😰', label: '스트레스' },
]

// Form schema
const checkinSchema = z.object({
  hours: z.number().min(0).max(24),
  notes: z.string().optional(),
  mood: z.enum(['great', 'good', 'okay', 'tired', 'stressed']).optional(),
})

type CheckinFormData = z.infer<typeof checkinSchema>

interface CheckinModalProps {
  studyPlanId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const defaultValues: CheckinFormData = {
  hours: 2,
  notes: '',
  mood: 'good',
}

export function CheckinModal({
  studyPlanId,
  isOpen,
  onClose,
  onSuccess,
}: CheckinModalProps) {
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [submittedMood, setSubmittedMood] = useState<MoodType>('good')
  const createCheckin = useCreateCheckin()
  const updateCheckin = useUpdateCheckin()
  const todayCheckin = useTodayCheckin(studyPlanId)

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!isOpen) return
    if (todayCheckin) {
      form.reset({
        hours: todayCheckin.hours_studied ?? defaultValues.hours,
        notes: todayCheckin.notes ?? '',
        mood: todayCheckin.mood ?? 'good',
      })
      return
    }
    form.reset(defaultValues)
  }, [form, isOpen, todayCheckin])

  const onSubmit = async (data: CheckinFormData) => {
    try {
      const payload = {
        study_plan_id: studyPlanId,
        checkin_date: new Date().toISOString().split('T')[0],
        hours_studied: data.hours,
        notes: data.notes,
        mood: data.mood,
      }
      if (todayCheckin?.id) {
        await updateCheckin.mutateAsync({
          id: todayCheckin.id,
          data: payload,
        })
      } else {
        await createCheckin.mutateAsync(payload)
      }

      // Show encouragement message
      setSubmittedMood(data.mood || 'good')
      setShowEncouragement(true)
    } catch (error) {
      console.error('Failed to create checkin:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    setShowEncouragement(false)
    onClose()
  }

  const handleEncouragementClose = () => {
    setShowEncouragement(false)
    onSuccess?.()
    onClose()
  }

  const hours = form.watch('hours')
  const selectedMood = form.watch('mood')
  const isSaving = createCheckin.isPending || updateCheckin.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {showEncouragement ? (
          <AIEncouragement
            mood={submittedMood}
            onClose={handleEncouragementClose}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>오늘의 학습 체크인</DialogTitle>
              <DialogDescription>
                오늘 공부한 내용과 기분을 기록해주세요.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Study Hours */}
              <div className="space-y-4">
                <Label>학습 시간</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">0시간</span>
                    <span className="font-bold text-xl text-primary">
                      {hours}시간
                    </span>
                    <span className="text-muted-foreground">12시간</span>
                  </div>
                  <Slider
                    value={[hours]}
                    onValueChange={(value) => form.setValue('hours', value[0])}
                    min={0}
                    max={12}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Mood Selector */}
              <div className="space-y-4">
                <Label>오늘의 기분</Label>
                <div className="flex justify-between gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => form.setValue('mood', mood.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                        selectedMood === mood.value
                          ? 'bg-primary/20 border-2 border-primary scale-105'
                          : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                      }`}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">오늘 공부한 내용</Label>
                <Textarea
                  id="notes"
                  placeholder="핵심 개념, 문제 풀이, 어려웠던 점을 간단히 적어주세요."
                  {...form.register('notes')}
                  className="min-h-[100px]"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : '체크인 완료'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
