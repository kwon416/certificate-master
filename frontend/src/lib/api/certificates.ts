/**
 * Certificates API
 * 
 * API functions for certificate-related operations.
 */

import { api } from './client'
import type { Certificate, CertificateList } from './types'

export interface SearchCertificatesParams {
  q?: string
  category?: string
  series?: string
  code?: string
  page?: number
  page_size?: number
}

export interface AutocompleteResult {
  id: string
  title: string
  categories: { code: string; name: string }[]
  series?: string | null
}

export interface SeriesByCategory {
  category: string
  series: string[]
}

export const certificatesAPI = {
  /**
   * Search certificates with filters
   */
  search: async (params: SearchCertificatesParams = {}): Promise<CertificateList> => {
    const searchParams = new URLSearchParams()
    
    if (params.q) searchParams.append('q', params.q)
    if (params.category) searchParams.append('category', params.category)
    if (params.series) searchParams.append('series', params.series)
    if (params.code) searchParams.append('code', params.code)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.page_size) searchParams.append('page_size', params.page_size.toString())
    
    const query = searchParams.toString()
    return api.get<CertificateList>(`/api/v1/certificates/search${query ? `?${query}` : ''}`)
  },

  /**
   * Autocomplete certificate titles
   */
  autocomplete: async (q: string, limit: number = 10): Promise<AutocompleteResult[]> => {
    const searchParams = new URLSearchParams()
    searchParams.append('q', q)
    searchParams.append('limit', limit.toString())
    
    return api.get<AutocompleteResult[]>(`/api/v1/certificates/autocomplete?${searchParams.toString()}`)
  },

  /**
   * Get certificate by ID
   */
  getById: async (id: string): Promise<Certificate> => {
    return api.get<Certificate>(`/api/v1/certificates/${id}`)
  },

  /**
   * Get certificate by raw_id
   */
  getByRawId: async (rawId: string): Promise<Certificate> => {
    return api.get<Certificate>(`/api/v1/certificates/raw/${rawId}`)
  },

  /**
   * Get all certificate categories
   */
  getCategories: async (): Promise<string[]> => {
    return api.get<string[]>('/api/v1/certificates/categories')
  },

  /**
   * Get series grouped by category
   */
  getSeries: async (category?: string): Promise<SeriesByCategory[]> => {
    const searchParams = new URLSearchParams()
    if (category) searchParams.append('category', category)
    
    const query = searchParams.toString()
    return api.get<SeriesByCategory[]>(`/api/v1/certificates/series${query ? `?${query}` : ''}`)
  },
}

