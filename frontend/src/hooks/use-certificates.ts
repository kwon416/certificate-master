/**
 * Certificates Hooks
 * 
 * React Query hooks for certificate data fetching.
 */

import { useQuery, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query'
import { certificatesAPI, SearchCertificatesParams } from '@/lib/api'
import type { Certificate, CertificateList } from '@/lib/api'

export const certificateKeys = {
  all: ['certificates'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: SearchCertificatesParams) => [...certificateKeys.lists(), params] as const,
  infiniteLists: () => [...certificateKeys.all, 'infinite-list'] as const,
  infiniteList: (params: Omit<SearchCertificatesParams, 'page'>) => [...certificateKeys.infiniteLists(), params] as const,
  details: () => [...certificateKeys.all, 'detail'] as const,
  detail: (id: string) => [...certificateKeys.details(), id] as const,
  categories: () => [...certificateKeys.all, 'categories'] as const,
}

/**
 * Hook to search certificates (single page)
 */
export function useCertificates(
  params: SearchCertificatesParams = {},
  options?: Omit<UseQueryOptions<CertificateList>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => certificatesAPI.search(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to search certificates with infinite scroll
 */
export function useInfiniteCertificates(
  params: Omit<SearchCertificatesParams, 'page'> = {},
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useInfiniteQuery({
    queryKey: certificateKeys.infiniteList(params),
    queryFn: ({ pageParam }) =>
      certificatesAPI.search({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage: CertificateList) => {
      if (lastPage.has_more) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled,
  })
}

/**
 * Hook to get certificate by ID
 */
export function useCertificate(
  id: string,
  options?: Omit<UseQueryOptions<Certificate>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: certificateKeys.detail(id),
    queryFn: () => certificatesAPI.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

/**
 * Hook to get certificate categories
 */
export function useCertificateCategories(
  options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: certificateKeys.categories(),
    queryFn: () => certificatesAPI.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  })
}

