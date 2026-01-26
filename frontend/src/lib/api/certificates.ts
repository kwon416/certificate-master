/**
 * Certificates API
 * 
 * API functions for certificate-related operations.
 */

import { api } from './client'
import type { Certificate, CertificateList, CategoryInfo } from './types'

export interface SearchCertificatesParams {
  q?: string
  categories?: string[]       // 복수 카테고리 지원 (category → categories)
  category_codes?: string[]   // 복수 코드 지원 (code → category_codes)
  series?: string
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
  category_name: string       // category → category_name
  category_code: string       // 추가됨
  series: string[]
}

export const certificatesAPI = {
  /**
   * Search certificates with filters
   */
  search: async (params: SearchCertificatesParams = {}): Promise<CertificateList> => {
    const searchParams = new URLSearchParams()

    if (params.q) searchParams.append('q', params.q)
    // 새 API: categories 배열
    if (params.categories) {
      params.categories.forEach(cat => searchParams.append('categories', cat))
    }
    // 새 API: category_codes 배열
    if (params.category_codes) {
      params.category_codes.forEach(code => searchParams.append('category_codes', code))
    }
    if (params.series) searchParams.append('series', params.series)
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
   * @returns CategoryInfo[] - 카테고리 코드와 이름 배열
   */
  getCategories: async (): Promise<CategoryInfo[]> => {
    return api.get<CategoryInfo[]>('/api/v1/certificates/categories')
  },

  /**
   * Get series grouped by category
   * @param categoryName - 카테고리 이름 (예: "국가기술자격")
   * @param categoryCode - 카테고리 코드 (예: "T")
   */
  getSeries: async (categoryName?: string, categoryCode?: string): Promise<SeriesByCategory[]> => {
    const searchParams = new URLSearchParams()
    if (categoryName) searchParams.append('category_name', categoryName)
    if (categoryCode) searchParams.append('category_code', categoryCode)

    const query = searchParams.toString()
    return api.get<SeriesByCategory[]>(`/api/v1/certificates/series${query ? `?${query}` : ''}`)
  },
}

