/**
 * useRecommendations Hook
 *
 * 자격증 추천 API를 위한 React Query 훅
 * - 위자드 기반 추천
 * - 자연어 기반 추천 (NEW)
 */
import { useMutation } from '@tanstack/react-query'
import {
  recommendationsAPI,
  type RecommendationRequest,
  type RecommendationResponse,
} from '@/lib/api/recommendations'
import type {
  NaturalLanguageRequest,
  NaturalLanguageResponse,
} from '@/lib/api/types'
import { useRecommendStore } from '@/stores/recommend-store'

/**
 * 자격증 추천 mutation 훅
 */
export function useRecommendations() {
  const { setRecommendations, setLoading, setError } = useRecommendStore()

  const mutation = useMutation({
    mutationFn: (request: RecommendationRequest) => {
      console.log('🔍 [추천 검색] 시작')
      console.log('📝 [추천 검색] 사용자 입력:', {
        목적: request.purpose,
        관심분야: request.interest_domains[0] || '(선택 없음)',
        공부기간: request.study_timeline,
        난이도선호: request.difficulty_preference,
        요약문장: request.user_summary || '(입력 없음)',
      })
      return recommendationsAPI.getRecommendations(request)
    },

    onMutate: () => {
      console.log('⏳ [추천 검색] 로딩 시작...')
      setLoading(true)
      setError(null)
    },

    onSuccess: (data: RecommendationResponse) => {
      console.log('✅ [추천 검색] 성공!')
      console.log('📊 [추천 검색] 결과 요약:', data.query_summary)
      console.log('🎯 [추천 검색] 추천 자격증 수:', data.total_matched)
      console.log('📋 [추천 검색] 추천 목록:', data.recommendations.map((rec, idx) => ({
        순위: idx + 1,
        자격증명: rec.certificate.title,
        매칭점수: `${rec.match_score}점`,
        추천이유: rec.recommendation_reason,
        핵심포인트: rec.key_points,
        실현가능성: rec.feasibility.can_prepare ? '가능' : '불가능',
        예상일수: `${rec.feasibility.estimated_days}일`,
      })))
      setRecommendations(data)
    },

    onError: (error: Error) => {
      console.error('❌ [추천 검색] 실패:', error.message)
      setError(error.message || '추천을 가져오는 중 오류가 발생했습니다.')
    },

    onSettled: () => {
      console.log('🏁 [추천 검색] 완료')
      setLoading(false)
    },
  })

  return {
    getRecommendations: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  }
}

/**
 * 자연어 기반 자격증 추천 mutation 훅 (NEW)
 *
 * 5단계 파이프라인:
 * 1. LLM 상황 구조화 (자연어 → JSON)
 * 2. 하드 필터링 (비전공자/재직자 조건)
 * 3. 임베딩 검색 (LLM 쿼리 생성 + ChromaDB)
 * 4. 후처리 점수화
 * 5. LLM 추천 이유 생성
 */
export function useNaturalRecommendations() {
  const { setNaturalRecommendations, setLoading, setError } = useRecommendStore()

  const mutation = useMutation({
    mutationFn: (request: NaturalLanguageRequest) => {
      console.log('🔍 [자연어 추천] 시작')
      console.log('📝 [자연어 추천] 사용자 입력:', request.user_input.substring(0, 100) + '...')
      return recommendationsAPI.getNaturalRecommendations(request)
    },

    onMutate: () => {
      console.log('⏳ [자연어 추천] AI 분석 시작...')
      setLoading(true)
      setError(null)
    },

    onSuccess: (data: NaturalLanguageResponse) => {
      console.log('✅ [자연어 추천] 성공!')
      console.log('🧠 [자연어 추천] 구조화된 컨텍스트:', {
        목표: data.structured_context.goal,
        취업상태: data.structured_context.employment_status,
        전공배경: data.structured_context.major_background,
        주당학습시간: data.structured_context.weekly_study_hours + '시간',
        최대준비기간: data.structured_context.max_study_period_days + '일',
        난이도선호: data.structured_context.difficulty_preference,
        관심산업: data.structured_context.preferred_industries,
      })
      console.log('🔎 [자연어 추천] 사용된 쿼리:', data.query_used)
      console.log('🎯 [자연어 추천] 추천 자격증 수:', data.total_matched)
      console.log('📋 [자연어 추천] 추천 목록:', data.recommendations.map((rec, idx) => ({
        순위: idx + 1,
        자격증명: rec.certificate.title,
        카테고리: rec.qualification_category,
        매칭점수: `${rec.match_score}점`,
        추천이유: rec.recommendation_reason,
        핵심포인트: rec.key_points,
        실현가능성: rec.feasibility.can_prepare ? '가능' : '불가능',
        예상일수: `${rec.feasibility.estimated_days}일`,
      })))
      if (data.follow_up_question) {
        console.log('❓ [자연어 추천] 후속 질문:', data.follow_up_question)
      }
      setNaturalRecommendations(data)
    },

    onError: (error: Error) => {
      console.error('❌ [자연어 추천] 실패:', error.message)
      setError(error.message || '자연어 추천을 가져오는 중 오류가 발생했습니다.')
    },

    onSettled: () => {
      console.log('🏁 [자연어 추천] 완료')
      setLoading(false)
    },
  })

  return {
    getNaturalRecommendations: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  }
}
