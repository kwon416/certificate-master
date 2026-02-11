'use client'

import {
  InteractionWizard,
  RecommendationResults,
  NaturalInput,
  NaturalResults,
} from '@/components/recommend'
import { useRecommendStore } from '@/stores/recommend-store'

export function RecommendContent() {
  const { recommendations, inputMode, naturalRecommendations } = useRecommendStore()

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI 자격증 추천
          </h1>
          <p className="text-slate-400">
            AI가 당신에게 맞는 자격증을 추천해드립니다
          </p>
        </div>

        {/* Recommend Content */}
        {recommendations ? (
          <RecommendationResults />
        ) : naturalRecommendations ? (
          <NaturalResults />
        ) : inputMode === 'natural' ? (
          <NaturalInput />
        ) : (
          <InteractionWizard />
        )}
      </div>
    </div>
  )
}
