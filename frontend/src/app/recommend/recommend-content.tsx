'use client'

import { DomainSelector } from '@/components/recommend/domain-selector'
import { useRecommendStore } from '@/stores/recommend-store'
import { recommendationsAPI } from '@/lib/api/recommendations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RecommendationCard } from '@/components/recommend/recommendation-card'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, RotateCcw } from 'lucide-react'

const QUESTION_TEMPLATES = [
  '비전공자인데 취업에 도움되는 자격증 추천해주세요',
  '3개월 안에 딸 수 있는 쉬운 자격증이 있나요?',
  '직장인인데 주말에만 공부할 수 있어요',
  '대학생인데 스펙 쌓기 좋은 자격증 추천해주세요',
  '실무 경험 있는데 경력에 도움되는 자격증이요',
]

const MIN_INPUT_LENGTH = 5

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
    if (selectedDomains.length === 0 || unifiedInput.length < MIN_INPUT_LENGTH) return

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

  const handleTemplateClick = (template: string) => {
    setUnifiedInput(template)
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
              unifiedStep !== 'domain' ? 'bg-emerald-500' : 'bg-border'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              unifiedStep === 'input' || unifiedStep === 'loading' ? 'bg-emerald-500' : 'bg-border'
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
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

            {/* 질문 템플릿 */}
            {!unifiedInput && (
              <div className="flex flex-wrap gap-2">
                {QUESTION_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    onClick={() => handleTemplateClick(template)}
                    className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 border border-border hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={unifiedInput}
              onChange={(e) => setUnifiedInput(e.target.value)}
              placeholder="예: 비전공자인데 3개월 안에 딸 수 있는 자격증을 추천해주세요"
              className="min-h-[150px] bg-muted/50 border-border focus:border-emerald-500 resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {unifiedInput.length}/1000자
              </span>
              <Button
                onClick={handleSubmit}
                disabled={unifiedInput.length < MIN_INPUT_LENGTH || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI 추천 받기
              </Button>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
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
                className="border-border"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 추천받기
              </Button>
            </div>

            <div className="space-y-4">
              {unifiedRecommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.certificate.id}
                  recommendation={{ ...rec, rank: index + 1 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
