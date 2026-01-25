/**
 * Checkins Hooks
 *
 * React Query hooks for check-in operations.
 * Created: 2026-01-07
 */

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { checkinsAPI } from '@/lib/api'
import type { Checkin, CheckinCreate, CheckinStats } from '@/lib/api'

// ==================== Query Keys ====================

export const checkinKeys = {
  all: ['checkins'] as const,
  byPlan: (planId: string | undefined) => [...checkinKeys.all, 'plan', planId] as const,
  stats: (planId?: string) => [...checkinKeys.all, 'stats', planId] as const,
}

// ==================== Types ====================

export interface WeeklyData {
  day: string
  hours: number
  date: Date
}

// ==================== Query Hooks ====================

/**
 * Hook to get all check-ins for a study plan
 */
export function useCheckins(
  studyPlanId: string | undefined,
  options?: Omit<UseQueryOptions<Checkin[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: checkinKeys.byPlan(studyPlanId),
    queryFn: () => checkinsAPI.getByStudyPlan(studyPlanId as string),
    enabled: !!studyPlanId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to get check-in statistics for a study plan
 */
export function useCheckinStats(
  studyPlanId: string | undefined,
  options?: Omit<UseQueryOptions<CheckinStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: checkinKeys.stats(studyPlanId),
    queryFn: () => checkinsAPI.getStats(studyPlanId as string),
    enabled: !!studyPlanId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to check if there's a check-in for today
 * Returns the today's check-in if exists, null otherwise
 */
export function useTodayCheckin(studyPlanId: string | undefined) {
  const { data: checkins } = useCheckins(studyPlanId)

  const todayCheckin = useMemo(() => {
    if (!checkins || !Array.isArray(checkins)) return null

    const today = new Date().toISOString().split('T')[0]
    return checkins.find(c => c.checkin_date === today) || null
  }, [checkins])

  return todayCheckin
}

/**
 * Hook to calculate weekly stats from check-ins
 * Returns last 7 days of study data for chart display
 */
export function useWeeklyStats(studyPlanId: string | undefined): WeeklyData[] {
  const { data: checkins } = useCheckins(studyPlanId)

  const weeklyData = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const result: WeeklyData[] = []

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      // Find check-ins for this day
      // Backend field names: checkin_date, hours_studied
      const dayHours = (Array.isArray(checkins) ? checkins : [])?.reduce((total, checkin) => {
        const checkinDate = new Date(checkin.checkin_date)
        checkinDate.setHours(0, 0, 0, 0)

        if (checkinDate.getTime() === date.getTime()) {
          return total + checkin.hours_studied
        }
        return total
      }, 0) || 0

      result.push({
        day: days[date.getDay()],
        hours: dayHours,
        date: date,
      })
    }

    return result
  }, [checkins])

  return weeklyData
}

// ==================== Mutation Hooks ====================

/**
 * Hook to create a new check-in
 */
export function useCreateCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CheckinCreate) => checkinsAPI.create(data),
    onSuccess: (newCheckin) => {
      // Invalidate the specific plan's check-ins and stats
      queryClient.invalidateQueries({
        queryKey: checkinKeys.byPlan(newCheckin.study_plan_id)
      })
      queryClient.invalidateQueries({
        queryKey: checkinKeys.stats(newCheckin.study_plan_id)
      })
      // Also invalidate all stats
      queryClient.invalidateQueries({
        queryKey: checkinKeys.stats()
      })
    },
  })
}

/**
 * Hook to update a check-in
 */
export function useUpdateCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CheckinCreate> }) =>
      checkinsAPI.update(id, data),
    onSuccess: (updatedCheckin) => {
      queryClient.invalidateQueries({
        queryKey: checkinKeys.byPlan(updatedCheckin.study_plan_id)
      })
      queryClient.invalidateQueries({
        queryKey: checkinKeys.stats(updatedCheckin.study_plan_id)
      })
    },
  })
}

/**
 * Hook to delete a check-in
 */
export function useDeleteCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, studyPlanId }: { id: string; studyPlanId: string }) =>
      checkinsAPI.delete(id).then(() => studyPlanId),
    onSuccess: (studyPlanId) => {
      queryClient.invalidateQueries({
        queryKey: checkinKeys.byPlan(studyPlanId)
      })
      queryClient.invalidateQueries({
        queryKey: checkinKeys.stats(studyPlanId)
      })
    },
  })
}
