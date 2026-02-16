'use client'

import { DomainSelector } from '@/components/recommend/domain-selector'
import { useRecommendStore } from '@/stores/recommend-store'
import { recommendationsAPI } from '@/lib/api/recommendations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, RotateCcw } from 'lucide-react'

export function RecommendContent() {
  const {
    selectedDomains,
    setSelectedDomains,
    unifiedInput,
    setUnifiedInput,
    unifiedStep,
    setUnifiedStep,
    unifiedRecommendations,
    setUnifiedRecommendations,
    unifiedContext,
    unifiedQueryUsed,
    unifiedTotalMatched,
    isLoading,
    setLoading,
    error,
    setError,
    resetUnified,
  } = useRecommendStore()

  const handleSubmit = async () => {
    if (selectedDomains.length === 0 || unifiedInput.length < 10) return

    setLoading(true)
    setError(null)
    setUnifiedStep('loading')

    try {
      const response = await recommendationsAPI.getUnifiedRecommendations({
        domains: selectedDomains,
        user_input: unifiedInput,
      })
      setUnifiedRecommendations(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '추천을 생성하는 중 오류가 발생했습니다.')
      setUnifiedStep('input')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI 자격증 추천
          </h1>
          <p className="text-muted-foreground">
            관심 분야를 선택하고 상황을 알려주시면, AI가 맞춤 자격증을 추천해드립니다
          </p>
        </div>

        {/* Step indicator */}
        {unifiedStep !== 'results' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full transition-colors ${
              unifiedStep === 'domain' ? 'bg-emerald-500' : 'bg-emerald-500/30'
            }`} />
            <div className={`w-8 h-0.5 ${
              unifiedStep !== 'domain' ? 'bg-emerald-500' : 'bg-slate-700'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              unifiedStep === 'input' || unifiedStep === 'loading' ? 'bg-emerald-500' : 'bg-slate-700'
            }`} />
          </div>
        )}

        {/* Step 1: Domain Selection */}
        {unifiedStep === 'domain' && (
          <div className="space-y-6">
            <DomainSelector
              selected={selectedDomains}
              onSelect={setSelectedDomains}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => setUnifiedStep('input')}
                disabled={selectedDomains.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Natural Language Input */}
        {unifiedStep === 'input' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setUnifiedStep('domain')}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-bold">
                  상황을 알려주세요
                </h2>
              </div>
              <p className="text-muted-foreground text-sm ml-7">
                선택한 분야: {selectedDomains.join(', ')}
              </p>
            </div>
            <Textarea
              value={unifiedInput}
              onChange={(e) => setUnifiedInput(e.target.value)}
              placeholder="예: 비전공자인데 3개월 안에 딸 수 있는 자격증을 추천해주세요. 현재 대학생이고 IT 분야 취업을 준비하고 있습니다."
              className="min-h-[150px] bg-slate-800/50 border-slate-700 focus:border-emerald-500 resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {unifiedInput.length}/1000자 (최소 10자)
              </span>
              <Button
                onClick={handleSubmit}
                disabled={unifiedInput.length < 10 || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI 추천 받기
              </Button>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {unifiedStep === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                AI가 맞춤 자격증을 분석하고 있습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                잠시만 기다려주세요...
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {unifiedStep === 'results' && unifiedRecommendations && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">추천 결과</h2>
                <p className="text-sm text-muted-foreground">
                  {unifiedTotalMatched}개 자격증 중 상위 {unifiedRecommendations.length}개를 추천합니다
                </p>
              </div>
              <Button
                variant="outline"
                onClick={resetUnified}
                className="border-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 추천받기
              </Button>
            </div>

            {/* Use existing NaturalResults-style display */}
            <div className="space-y-4">
              {unifiedRecommendations.map((rec, index) => (
                <div
                  key={rec.certificate.id}
                  className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold text-lg">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-foreground">
                          {rec.certificate.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.qualification_category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        {rec.match_score}점
                      </div>
                      <div className="text-xs text-muted-foreground">매칭 점수</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300">
                    {rec.recommendation_reason}
                  </p>

                  {rec.key_points && rec.key_points.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rec.key_points.map((point, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    {rec.quick_stats?.passing_rate && (
                      <span>합격률: {rec.quick_stats.passing_rate}%</span>
                    )}
                    {rec.feasibility && (
                      <span>준비 기간: 약 {Math.ceil(rec.feasibility.estimated_days / 30)}개월</span>
                    )}
                    {rec.quick_stats?.exam_type && (
                      <span>시험 유형: {rec.quick_stats.exam_type}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
