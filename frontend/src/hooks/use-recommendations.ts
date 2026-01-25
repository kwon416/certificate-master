/**
 * useRecommendations Hook
 *
 * 자격증 추천 API를 위한 React Query 훅
 */
import { useMutation } from '@tanstack/react-query'
import {
  recommendationsAPI,
  type RecommendationRequest,
  type RecommendationResponse,
} from '@/lib/api/recommendations'
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
