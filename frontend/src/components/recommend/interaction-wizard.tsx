/**
 * InteractionWizard Component
 *
 * 5단계 인터랙션 위자드 메인 컨테이너
 * 모바일 친화적 UX: 스텝 변경 시 스크롤, 하단 고정 버튼
 * 자연어 입력 모드 전환 지원 (NEW)
 */
'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardProgress } from './wizard-progress'
import { WizardStep } from './wizard-step'
import {
  useRecommendStore,
  WIZARD_STEPS,
  areAllAnswersComplete,
  mapAnswersToApiRequest,
  type WizardAnswers,
} from '@/stores/recommend-store'
import { useRecommendations } from '@/hooks/use-recommendations'

export function InteractionWizard() {
  const { currentStep, answers, setAnswer, nextStep, prevStep, naturalInputInWizard } = useRecommendStore()
  const { getRecommendations, isLoading } = useRecommendations()
  const wizardRef = useRef<HTMLDivElement>(null)

  const currentStepConfig = WIZARD_STEPS[currentStep - 1]
  const isLastStep = currentStep === WIZARD_STEPS.length
  const isFirstStep = currentStep === 1
  const secondaryKey = currentStepConfig.secondaryKey
  const tertiaryKey = currentStepConfig.tertiaryKey

  // 스텝 변경 시 위자드 상단으로 스크롤 (헤더 높이 고려)
  useEffect(() => {
    if (wizardRef.current) {
      // 헤더 높이(약 64px) + 여유 공간을 고려한 오프셋
      const headerHeight = 80
      const element = wizardRef.current
      const y = element.getBoundingClientRect().top + window.scrollY - headerHeight

      window.scrollTo({
        top: Math.max(0, y),
        behavior: 'smooth'
      })
    }
  }, [currentStep])

  const handleAnswer = (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => {
    setAnswer(key, value)

    // Auto-advance for single-select option steps only
    if (
      (!currentStepConfig.type || currentStepConfig.type === 'options') &&
      !isLastStep
    ) {
      setTimeout(() => {
        nextStep()
      }, 300) // Small delay for better UX
    }
  }

  const handleNext = () => {
    if (isLastStep && areAllAnswersComplete(answers)) {
      const selectedDomain = answers.interest_domains
        ? [answers.interest_domains]
        : []

      // 통합 필드 → API 필드 매핑
      const apiFields = mapAnswersToApiRequest(answers)

      // 자연어 입력이 있으면 user_summary로 전달
      getRecommendations({
        purpose: apiFields.purpose,
        interest_domains: selectedDomain,
        study_timeline: apiFields.study_timeline,
        difficulty_preference: apiFields.difficulty_preference,
        user_summary: naturalInputInWizard.trim() || undefined,
        current_status: apiFields.current_status,
        study_commitment: apiFields.study_commitment,
        // 향상된 검색 필드 (선택)
        target_jobs: answers.target_jobs || undefined,
        target_industries: answers.target_industries || undefined,
        certificate_level: answers.certificate_level || undefined,
        specific_keywords: answers.specific_keywords || undefined,
      })
    } else if (!isLastStep) {
      nextStep()
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      prevStep()
    }
  }

  const canGoNext = () => {
    const currentAnswer = answers[currentStepConfig.key]

    if (currentStepConfig.optional) {
      return true
    }

    if (currentStepConfig.type === 'input') {
      return typeof currentAnswer === 'string' && currentAnswer.trim().length > 0
    }

    return currentAnswer !== null
  }

  return (
    <div ref={wizardRef} className="max-w-3xl mx-auto px-4 py-4 md:p-6 relative pb-24 md:pb-6">
      {/* Progress */}
      <WizardProgress currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />

      {/* Step Content - 모바일에서 패딩 축소 */}
      <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-4 md:p-8 mb-6 transition-[transform,opacity] duration-300">
        <WizardStep
          step={currentStepConfig.step}
          title={currentStepConfig.title}
          description={currentStepConfig.description}
          answerKey={currentStepConfig.key}
          currentAnswer={answers[currentStepConfig.key]}
          onAnswer={(value) => handleAnswer(currentStepConfig.key, value)}
          options={currentStepConfig.options}
          type={currentStepConfig.type}
          min={currentStepConfig.min}
          max={currentStepConfig.max}
          sliderStep={currentStepConfig.sliderStep}
          placeholder={currentStepConfig.placeholder}
          secondaryAnswer={
            secondaryKey
              ? answers[secondaryKey]
              : undefined
          }
          onSecondaryAnswer={
            secondaryKey
              ? (value) => setAnswer(secondaryKey, value)
              : undefined
          }
          secondaryOptions={currentStepConfig.secondaryOptions}
          tertiaryAnswer={
            tertiaryKey
              ? answers[tertiaryKey]
              : undefined
          }
          onTertiaryAnswer={
            tertiaryKey
              ? (value) => setAnswer(tertiaryKey, value)
              : undefined
          }
          tertiaryOptions={currentStepConfig.tertiaryOptions}
        />
      </div>

      {/* Navigation Buttons - 모바일에서 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-background/95 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none border-t border-border md:border-0 p-4 md:p-0 z-40">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstStep || isLoading}
            className="flex-1 md:flex-none px-4 md:px-6 h-12 md:h-10"
          >
            <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" />
            이전
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isLoading}
            className="flex-1 md:flex-none px-4 md:px-6 h-12 md:h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                추천 중{'\u2026'}
              </>
            ) : isLastStep ? (
              <>
                추천받기
                <ChevronRight className="w-4 h-4 ml-1 md:ml-2" />
              </>
            ) : (
              <>
                다음
                <ChevronRight className="w-4 h-4 ml-1 md:ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
          <div className="bg-muted/90 border border-border rounded-xl p-8 text-center max-w-md">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              추천 검색 중{'\u2026'}
            </h3>
            <p className="text-muted-foreground text-sm">
              AI가 당신에게 맞는 자격증을 찾고 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
