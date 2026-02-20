/**
 * Recommendations API Client
 *
 * 자격증 추천 API 클라이언트
 * - 통합 추천 (하이브리드 검색: Dense + BM25 + RRF)
 */
import { api } from './client'
import type {
  NaturalRecommendedCertificate,
  StructuredUserContext,
} from './types'

// Unified recommendation types
export interface UnifiedRecommendationRequest {
  domains?: string[]
  user_input: string
}

// Structured recommendation types (Contextual Retrieval)
export interface StructuredRecommendationRequest {
  domains: string[]
  purpose: string
  current_status: string
  preference_tags?: string[]
  additional_input?: string
}

export interface SearchStats {
  dense_count: number
  sparse_count: number
  merged_count: number
  elapsed_ms: number
}

export interface UnifiedRecommendationResponse {
  structured_context: StructuredUserContext
  recommendations: NaturalRecommendedCertificate[]
  query_used: string
  total_matched: number
  search_stats?: SearchStats
}

/**
 * 추천 API
 */
export const recommendationsAPI = {
  /**
   * 통합 자격증 추천 (분야 선택 + 자연어)
   *
   * 하이브리드 검색 파이프라인:
   * 1. 규칙 기반 컨텍스트 파싱 (4단계 NLU)
   * 2. Dense + BM25 Sparse + RRF 결합 검색
   * 3. 데이터 기반 템플릿 추천 이유 생성
   */
  async getUnifiedRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<UnifiedRecommendationResponse> {
    console.log('🌐 [API] POST /api/v1/recommendations/unified')

    const minLoadingTime = 800 // 하이브리드 검색은 ~1-2초
    const startTime = Date.now()

    try {
      const response = await api.post<UnifiedRecommendationResponse>(
        '/api/v1/recommendations/unified',
        request
      )

      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      return response
    } catch (error) {
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      throw error
    }
  },

  /**
   * 구조화된 입력 기반 자격증 추천 (Contextual Retrieval)
   *
   * 3단계 파이프라인:
   * 1. 구조화된 입력 → 검색 쿼리 + 메타데이터 필터
   * 2. Dense + BM25 Sparse + RRF 결합 검색
   * 3. 데이터 기반 템플릿 추천 이유 생성
   */
  async getStructuredRecommendations(
    request: StructuredRecommendationRequest
  ): Promise<UnifiedRecommendationResponse> {
    console.log('🌐 [API] POST /api/v1/recommendations/structured')

    const minLoadingTime = 800
    const startTime = Date.now()

    try {
      const response = await api.post<UnifiedRecommendationResponse>(
        '/api/v1/recommendations/structured',
        request
      )

      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      return response
    } catch (error) {
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      throw error
    }
  },
}
