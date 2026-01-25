/**
 * Study Plans Hooks
 * 
 * React Query hooks for study plan operations.
 * Updated to match Backend API Schema (2026-01-06)
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { studyPlansAPI } from '@/lib/api'
import type { StudyPlan, StudyPlanCreate, StudyPlanUpdate, StudyPlanList, Milestone } from '@/lib/api'

export const studyPlanKeys = {
  all: ['study-plans'] as const,
  lists: () => [...studyPlanKeys.all, 'list'] as const,
  list: (filters: string) => [...studyPlanKeys.lists(), { filters }] as const,
  details: () => [...studyPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...studyPlanKeys.details(), id] as const,
}

/**
 * Hook to get all study plans
 */
export function useStudyPlans(
  options?: Omit<UseQueryOptions<StudyPlanList>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: studyPlanKeys.lists(),
    queryFn: () => studyPlansAPI.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to get study plan by ID
 */
export function useStudyPlan(
  id: string | undefined,
  options?: Omit<UseQueryOptions<StudyPlan>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: studyPlanKeys.detail(id!),
    queryFn: () => studyPlansAPI.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to create study plan
 */
export function useCreateStudyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StudyPlanCreate) => studyPlansAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() })
    },
  })
}

/**
 * Hook to update study plan
 */
export function useUpdateStudyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudyPlanUpdate }) =>
      studyPlansAPI.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() })
    },
  })
}

/**
 * Hook to update study plan status
 */
export function useUpdateStudyPlanStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'completed' | 'paused' | 'cancelled' }) =>
      studyPlansAPI.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() })
    },
  })
}

/**
 * Hook to update milestones
 */
export function useUpdateMilestones() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, milestones }: { id: string; milestones: Milestone[] }) =>
      studyPlansAPI.updateMilestones(id, milestones),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() })
    },
  })
}

/**
 * Hook to delete study plan
 */
export function useDeleteStudyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => studyPlansAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() })
    },
  })
}

