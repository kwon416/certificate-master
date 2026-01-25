import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Velocity metrics response from backend API
 */
export interface VelocityMetrics {
  expected_progress: number    // 예상 진행률 (0-100)
  actual_progress: number       // 실제 진행률 (0-100)
  progress_delta: number        // 진행률 차이 (actual - expected)
  velocity: number              // 진행 속도 (%/day)
  predicted_date: string        // 예상 완료일 (ISO date)
  status: 'ahead' | 'on-track' | 'behind' | 'critical'  // 진행 상태
}

/**
 * Hook to fetch velocity metrics for a study plan
 *
 * @param studyPlanId - Study plan UUID
 * @returns Query result with velocity metrics
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useVelocityMetrics(planId)
 *
 * if (data) {
 *   console.log(data.status) // 'ahead' | 'on-track' | 'behind' | 'critical'
 *   console.log(data.predicted_date) // '2026-05-15'
 * }
 * ```
 */
export function useVelocityMetrics(studyPlanId: string | undefined) {
  return useQuery({
    queryKey: ['velocity', studyPlanId],
    queryFn: async () => {
      if (!studyPlanId) {
        throw new Error('Study plan ID is required')
      }

      // API client returns data directly, not wrapped in { data: ... }
      const data = await api.get<VelocityMetrics>(
        `/progress-analytics/${studyPlanId}/velocity`
      )

      return data
    },
    enabled: !!studyPlanId,
    staleTime: 2 * 60 * 1000,  // 2 minutes - data doesn't change frequently
    refetchInterval: 5 * 60 * 1000,  // Auto-refresh every 5 minutes
    retry: 2,  // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
