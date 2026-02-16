/**
 * Recommendations API Client
 *
 * 자격증 추천 API 클라이언트
 * - 기존 위자드 기반 추천
 * - 자연어 기반 추천 (NEW)
 */
import { api } from './client'
import type {
  Certificate,
  NaturalLanguageRequest,
  NaturalLanguageResponse,
  StructuredUserContext,
} from './types'

// Unified recommendation types (Redesign)
export interface UnifiedRecommendationRequest {
  domains: string[]
  user_input: string
}

export interface UnifiedRecommendationResponse {
  structured_context: StructuredUserContext
  recommendations: RecommendedCertificate[]
  query_used: string
  total_matched: number
}

// Request types
export interface RecommendationRequest {
  purpose: string                  // 추천 목적 (취업, 이직, 전문성 강화 등)
  interest_domains: string[]       // 관심 분야(단일 선택을 배열로 전송)
  study_timeline: string           // 예상 공부 기간 (하위 호환성)
  difficulty_preference: string    // 난이도 선호 (하위 호환성)
  user_summary?: string            // 최종 한 문장 요약 (선택)
  // 새 필드 (선택, 소프트 필터에 사용)
  current_status?: string          // 현재 상황 (student, entry_jobseeker, etc.)
  study_commitment?: string        // 투자 시간 (relaxed, moderate, intensive, unsure)
  // 향상된 검색 필드 (선택, 키워드 매칭 보너스에 사용)
  target_jobs?: string[]           // 목표 직종 키워드 (예: ["전기기술자", "전기안전관리자"])
  target_industries?: string[]     // 산업 분야 키워드 (예: ["전기공사", "제조업"])
  certificate_level?: string       // 자격증 등급 선호 (기능장, 기사, 산업기사, 기능사, 상관없음)
  specific_keywords?: string[]     // 특정 키워드 (예: ["전기"])
}

// Response types
export interface Feasibility {
  can_prepare: boolean
  estimated_days: number
}

export interface QuickStats {
  passing_rate: number | null
  average_salary: string | null
  exam_fee: string | null
  exam_type: string | null
}

export interface StudyInsights {
  study_tips: string[]
  success_tips: string[]
  difficulty_feedback: string | null
}

export interface RecommendedCertificate {
  certificate: Certificate
  match_score: number
  recommendation_reason: string
  key_points: string[]
  feasibility: Feasibility
  quick_stats?: QuickStats
  study_insights?: StudyInsights
}

export interface RecommendationResponse {
  recommendations: RecommendedCertificate[]
  query_summary: string
  user_summary?: string | null  // 사용자가 입력한 원본 요청 문장
  total_matched: number
}

/**
 * 추천 API
 */
export const recommendationsAPI = {
  /**
   * 자격증 추천 받기 (위자드 기반)
   */
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    console.log('🌐 [API 호출] POST /api/v1/recommendations/')
    console.log('📤 [API 호출] 요청 데이터:', request)

    // Add minimum loading time in development for UX testing
    const minLoadingTime = 1500 // 1.5 seconds
    const startTime = Date.now()

    try {
      const response = await api.post<RecommendationResponse>(
        '/api/v1/recommendations/',
        request
      )

      console.log('📥 [API 호출] 응답 데이터:', response)

      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      return response
    } catch (error) {
      // Even on error, show loading UI for minimum time
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      throw error
    }
  },

  /**
   * 자연어 기반 자격증 추천 받기 (NEW)
   *
   * 5단계 파이프라인:
   * 1. LLM 상황 구조화 (자연어 → JSON)
   * 2. 하드 필터링 (비전공자/재직자 조건)
   * 3. 임베딩 검색 (LLM 쿼리 생성 + ChromaDB)
   * 4. 후처리 점수화
   * 5. LLM 추천 이유 생성
   */
  async getNaturalRecommendations(
    request: NaturalLanguageRequest
  ): Promise<NaturalLanguageResponse> {
    console.log('🌐 [API 호출] POST /api/v1/recommendations/natural')
    console.log('📤 [API 호출] 요청 데이터:', request.user_input.substring(0, 50) + '...')

    // Add minimum loading time for LLM processing UX
    const minLoadingTime = 2000 // 2 seconds (LLM 처리 시간 고려)
    const startTime = Date.now()

    try {
      const response = await api.post<NaturalLanguageResponse>(
        '/api/v1/recommendations/natural',
        request
      )

      console.log('📥 [API 호출] 응답 데이터:', response)
      console.log('📊 [API 호출] 구조화된 컨텍스트:', response.structured_context)

      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      return response
    } catch (error) {
      // Even on error, show loading UI for minimum time
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      throw error
    }
  },

  /**
   * 통합 자격증 추천 (분야 선택 + 자연어)
   */
  async getUnifiedRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<UnifiedRecommendationResponse> {
    console.log('🌐 [API] POST /api/v1/recommendations/unified')

    const minLoadingTime = 2000
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
}
