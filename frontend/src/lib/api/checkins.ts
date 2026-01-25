/**
 * Checkins API
 * 
 * API functions for check-in operations.
 */

import { api } from './client'
import type { Checkin, CheckinCreate, CheckinStats, CheckinList } from './types'

export const checkinsAPI = {
  /**
   * Get all check-ins for a study plan
   * Backend returns: { items: Checkin[], total: number }
   * Extract and return just the items array
   */
  getByStudyPlan: async (studyPlanId: string): Promise<Checkin[]> => {
    const response = await api.get<CheckinList>(`/api/v1/checkins/?study_plan_id=${studyPlanId}`)
    return response.items || []
  },

  /**
   * Get check-in statistics
   */
  getStats: async (studyPlanId: string): Promise<CheckinStats> => {
    return api.get<CheckinStats>(`/api/v1/checkins/stats?study_plan_id=${studyPlanId}`)
  },

  /**
   * Create new check-in
   */
  create: async (data: CheckinCreate): Promise<Checkin> => {
    return api.post<Checkin>('/api/v1/checkins/', data)
  },

  /**
   * Update check-in
   */
  update: async (id: string, data: Partial<CheckinCreate>): Promise<Checkin> => {
    return api.patch<Checkin>(`/api/v1/checkins/${id}`, data)
  },

  /**
   * Delete check-in
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/checkins/${id}`)
  },
}

