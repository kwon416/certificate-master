/**
 * Analytics Hooks
 *
 * React Query hooks for fetching and managing analytics data.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { analyticsAPI } from '@/lib/api'
import type { ProgressAnalytics, LearningPattern } from '@/lib/api/types'

/**
 * Hook to fetch progress analytics for a study plan
 *
 * @param studyPlanId - Study plan UUID
 * @param options - React Query options
 * @returns Query result with ProgressAnalytics data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProgressAnalytics(planId)
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <ErrorMessage />
 *
 * return (
 *   <div>
 *     <p>진도율: {data.completion_rate}%</p>
 *     <p>상태: {data.status}</p>
 *   </div>
 * )
 * ```
 */
export function useProgressAnalytics(
  studyPlanId: string | undefined,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
): UseQueryResult<ProgressAnalytics, Error> {
  return useQuery({
    queryKey: ['analytics', 'progress', studyPlanId],
    queryFn: () => {
      if (!studyPlanId) {
        throw new Error('Study plan ID is required')
      }
      return analyticsAPI.getProgressAnalytics(studyPlanId)
    },
    enabled: !!studyPlanId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Hook to fetch learning pattern analysis for a study plan
 *
 * @param studyPlanId - Study plan UUID
 * @param options - React Query options
 * @returns Query result with LearningPattern data
 *
 * Note: Backend requires minimum 3 checkins for analysis.
 * Will return error if insufficient data.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLearningPattern(planId)
 *
 * if (isLoading) return <Skeleton />
 * if (error?.message.includes('insufficient')) {
 *   return <p>3회 이상 체크인 후 이용 가능합니다</p>
 * }
 *
 * return (
 *   <div>
 *     <p>선호 시간대: {data.preferred_time_slots.join(', ')}</p>
 *     <p>일관성 점수: {data.consistency_score}/100</p>
 *   </div>
 * )
 * ```
 */
export function useLearningPattern(
  studyPlanId: string | undefined,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
): UseQueryResult<LearningPattern, Error> {
  return useQuery({
    queryKey: ['analytics', 'learning-pattern', studyPlanId],
    queryFn: () => {
      if (!studyPlanId) {
        throw new Error('Study plan ID is required')
      }
      return analyticsAPI.getLearningPattern(studyPlanId)
    },
    enabled: !!studyPlanId && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates)
    refetchInterval: options?.refetchInterval,
  })
}
