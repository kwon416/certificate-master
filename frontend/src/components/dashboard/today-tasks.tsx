'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, BookOpen, FileText, HelpCircle, Edit3, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  duration: string
  type: 'lecture' | 'problem' | 'review' | 'other'
  completed: boolean
}

interface TodayTasksProps {
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
  onCheckin?: () => void
  hasCheckedInToday?: boolean
  todayStudyHours?: number
  onEditCheckin?: () => void
}

const taskTypeIcons = {
  lecture: BookOpen,
  problem: FileText,
  review: HelpCircle,
  other: Clock,
}

const taskTypeColors = {
  lecture: 'text-cyan-600 dark:text-cyan-400',
  problem: 'text-violet-600 dark:text-violet-400',
  review: 'text-amber-600 dark:text-amber-400',
  other: 'text-muted-foreground',
}

export function TodayTasks({
  tasks,
  onToggleTask,
  onCheckin,
  hasCheckedInToday = false,
  todayStudyHours = 0,
  onEditCheckin,
}: TodayTasksProps) {
  const [localTasks, setLocalTasks] = useState(tasks)

  const handleToggle = (taskId: string) => {
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
    onToggleTask?.(taskId)
  }

  const completedCount = localTasks.filter((t) => t.completed).length
  const totalCount = localTasks.length

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">오늘의 학습</CardTitle>
          {hasCheckedInToday ? (
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              체크인 완료
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} 완료
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task List */}
        <div className="space-y-3">
          {localTasks.map((task) => {
            const Icon = taskTypeIcons[task.type]
            return (
              <button
                key={task.id}
                onClick={() => handleToggle(task.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl transition-colors duration-200',
                  task.completed
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-muted/50 border border-border/50 hover:border-border'
                )}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Task Type Icon */}
                <div className="flex-shrink-0">
                  <Icon className={cn('h-5 w-5', taskTypeColors[task.type])} />
                </div>

                {/* Task Content */}
                <div className="flex-1 text-left">
                  <p
                    className={cn(
                      'font-medium',
                      task.completed
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}
                  >
                    {task.title}
                  </p>
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  {task.duration}
                </div>
              </button>
            )
          })}
        </div>

        {/* Checkin Button / Summary */}
        {hasCheckedInToday ? (
          <div className="space-y-3">
            {/* Today's Summary */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/80">오늘의 학습 시간</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {todayStudyHours}h
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                오늘도 목표를 향해 한 걸음 전진했어요! 🎉
              </p>
            </div>

            {/* Edit Button */}
            <Button
              onClick={onEditCheckin}
              variant="outline"
              className="w-full border-border hover:border-border"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              체크인 수정하기
            </Button>
          </div>
        ) : (
          <Button
            onClick={onCheckin}
            disabled={completedCount < totalCount}
            className={cn(
              'w-full',
              completedCount >= totalCount
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {completedCount >= totalCount ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                오늘 학습 완료! 체크인하기
              </>
            ) : (
              <>
                <Clock className="mr-2 h-5 w-5" />
                {totalCount - completedCount}개 더 완료하세요
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

