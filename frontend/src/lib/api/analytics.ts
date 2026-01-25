/**
 * Analytics API Client
 *
 * API functions for fetching progress analytics and learning pattern data.
 */

import { api } from './client'
import type { ProgressAnalytics, LearningPattern } from './types'

/**
 * Get progress analytics for a study plan
 *
 * Retrieves comprehensive progress analysis including:
 * - Completion rate (진도율)
 * - Time adherence rate (시간 이행률)
 * - Schedule adherence rate (일정 준수율)
 * - Current streak (학습 연속성)
 * - Learner status classification
 * - Risk signals and recommendations
 *
 * @param studyPlanId - Study plan UUID
 * @returns ProgressAnalytics object
 * @throws APIError if request fails
 *
 * Backend endpoint: GET /api/v1/analytics/progress/{study_plan_id}
 */
export async function getProgressAnalytics(studyPlanId: string): Promise<ProgressAnalytics> {
  return api.get<ProgressAnalytics>(`/api/v1/analytics/progress/${studyPlanId}`)
}

/**
 * Get learning pattern analysis for a study plan
 *
 * Analyzes learning habits and patterns including:
 * - Preferred study time slots (선호 시간대)
 * - Average session duration (평균 세션 시간)
 * - Best/worst weekdays (효율적인 요일)
 * - Mood trends (기분 추이)
 * - Consistency score (일관성 점수)
 *
 * Note: Requires minimum 3 checkins for analysis.
 * Returns 400 error if insufficient data.
 *
 * @param studyPlanId - Study plan UUID
 * @returns LearningPattern object
 * @throws APIError if request fails or insufficient data
 *
 * Backend endpoint: GET /api/v1/analytics/learning-pattern/{study_plan_id}
 */
export async function getLearningPattern(studyPlanId: string): Promise<LearningPattern> {
  return api.get<LearningPattern>(`/api/v1/analytics/learning-pattern/${studyPlanId}`)
}

/**
 * Analytics API module
 *
 * Exports all analytics-related API functions
 */
export const analyticsAPI = {
  getProgressAnalytics,
  getLearningPattern,
} as const
