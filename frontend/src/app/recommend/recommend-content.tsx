'use client'

import { DomainSelector } from '@/components/recommend/domain-selector'
import { useRecommendStore } from '@/stores/recommend-store'
import { recommendationsAPI } from '@/lib/api/recommendations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RecommendationCard } from '@/components/recommend/recommendation-card'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, RotateCcw, Check } from 'lucide-react'

const PURPOSE_OPTIONS = [
  { value: '취업', label: '취업', icon: '💼' },
  { value: '이직', label: '이직', icon: '🔄' },
  { value: '전문성 강화', label: '전문성 강화', icon: '📈' },
  { value: '실무 활용', label: '실무 활용', icon: '🛠️' },
  { value: '교양', label: '교양', icon: '📚' },
]

const STATUS_OPTIONS = [
  { value: '학생', label: '학생', icon: '🎓' },
  { value: '취준생', label: '취준생', icon: '🔍' },
  { value: '직장인', label: '직장인', icon: '💻' },
  { value: '경력자', label: '경력자', icon: '⭐' },
  { value: '전업 준비', label: '전업 준비', icon: '🔄' },
]

const PREFERENCE_TAGS = [
  { value: '독학 가능', label: '독학 가능', icon: '📖' },
  { value: '비전공자', label: '비전공자', icon: '🌱' },
  { value: '비용 저렴', label: '비용 저렴', icon: '💰' },
  { value: 'CBT 상시시험', label: 'CBT 상시시험', icon: '🖥️' },
]

export function RecommendContent() {
  const {
    selectedDomains,
    setSelectedDomains,
    unifiedStep,
    setUnifiedStep,
    unifiedRecommendations,
    setUnifiedRecommendations,
    unifiedTotalMatched,
    structuredPurpose,
    setStructuredPurpose,
    structuredStatus,
    setStructuredStatus,
    structuredPreferenceTags,
    togglePreferenceTag,
    structuredAdditionalInput,
    setStructuredAdditionalInput,
    isLoading,
    setLoading,
    error,
    setError,
    resetUnified,
  } = useRecommendStore()

  const handleSubmit = async (skip = false) => {
    if (selectedDomains.length === 0 || !structuredPurpose || !structuredStatus) return

    setLoading(true)
    setError(null)
    setUnifiedStep('loading')

    try {
      const response = await recommendationsAPI.getStructuredRecommendations({
        domains: selectedDomains,
        purpose: structuredPurpose,
        current_status: structuredStatus,
        preference_tags: skip ? [] : structuredPreferenceTags,
        additional_input: skip ? '' : structuredAdditionalInput,
      })
      setUnifiedRecommendations(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '추천을 생성하는 중 오류가 발생했습니다.')
      setUnifiedStep('preferences')
    } finally {
      setLoading(false)
    }
  }

  const currentStepNum = unifiedStep === 'domain' ? 1 : unifiedStep === 'context' ? 2 : 3

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI 자격증 추천
          </h1>
          <p className="text-muted-foreground">
            관심 분야와 상황을 선택하면 AI가 맞춤 자격증을 추천해드립니다
          </p>
        </div>

        {/* Step indicator */}
        {!['results', 'loading'].includes(unifiedStep) && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  step <= currentStepNum ? 'bg-emerald-500' : 'bg-border'
                }`} />
                {i < 2 && (
                  <div className={`w-8 h-0.5 ${
                    step < currentStepNum ? 'bg-emerald-500' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
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
                onClick={() => setUnifiedStep('context')}
                disabled={selectedDomains.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Purpose + Status */}
        {unifiedStep === 'context' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setUnifiedStep('domain')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl md:text-2xl font-bold">
                목적과 상황을 알려주세요
              </h2>
            </div>

            {/* Purpose */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">어떤 목적인가요?</h3>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStructuredPurpose(opt.value)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      structuredPurpose === opt.value
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/50 hover:text-foreground'
                    }`}
                  >
                    <span className="mr-1.5">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">현재 상황은?</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStructuredStatus(opt.value)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      structuredStatus === opt.value
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/50 hover:text-foreground'
                    }`}
                  >
                    <span className="mr-1.5">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setUnifiedStep('preferences')}
                disabled={!structuredPurpose || !structuredStatus}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences + Additional Input */}
        {unifiedStep === 'preferences' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setUnifiedStep('context')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl md:text-2xl font-bold">
                추가 조건이 있나요?
              </h2>
            </div>

            <p className="text-sm text-muted-foreground -mt-4 ml-7">
              선택하지 않아도 괜찮아요
            </p>

            {/* Preference Tags */}
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => togglePreferenceTag(tag.value)}
                  className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                    structuredPreferenceTags.includes(tag.value)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/50'
                  }`}
                >
                  {structuredPreferenceTags.includes(tag.value) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{tag.icon}</span>
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Additional Input */}
            <Textarea
              value={structuredAdditionalInput}
              onChange={(e) => setStructuredAdditionalInput(e.target.value)}
              placeholder="추가로 알려주실 내용이 있나요? (선택사항)"
              className="min-h-[80px] bg-muted/50 border-border focus:border-emerald-500 resize-none"
              maxLength={500}
            />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                건너뛰기
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
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
