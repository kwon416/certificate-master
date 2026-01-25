/**
 * Study Plans API
 * 
 * API functions for study plan operations.
 * Updated to match Backend API Schema (2026-01-06)
 */

import { api } from './client'
import type { StudyPlan, StudyPlanCreate, StudyPlanUpdate, StudyPlanList } from './types'

export const studyPlansAPI = {
  /**
   * Get all study plans for current user
   */
  getAll: async (): Promise<StudyPlanList> => {
    return api.get<StudyPlanList>('/api/v1/study-plans/')
  },

  /**
   * Get study plan by ID
   */
  getById: async (id: string): Promise<StudyPlan> => {
    return api.get<StudyPlan>(`/api/v1/study-plans/${id}`)
  },

  /**
   * Create new study plan
   */
  create: async (data: StudyPlanCreate): Promise<StudyPlan> => {
    return api.post<StudyPlan>('/api/v1/study-plans/', data)
  },

  /**
   * Update study plan (partial update)
   */
  update: async (id: string, data: StudyPlanUpdate): Promise<StudyPlan> => {
    return api.patch<StudyPlan>(`/api/v1/study-plans/${id}`, data)
  },

  /**
   * Update study plan status
   */
  updateStatus: async (
    id: string,
    status: 'active' | 'completed' | 'paused' | 'cancelled'
  ): Promise<StudyPlan> => {
    return api.patch<StudyPlan>(`/api/v1/study-plans/${id}`, { status })
  },

  /**
   * Update milestones (mark as completed, etc.)
   */
  updateMilestones: async (
    id: string,
    milestones: Array<{ week: number; title: string; description: string; hours: number; completed: boolean }>
  ): Promise<StudyPlan> => {
    return api.patch<StudyPlan>(`/api/v1/study-plans/${id}`, { milestones })
  },

  /**
   * Delete study plan
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/study-plans/${id}`)
  },
}

