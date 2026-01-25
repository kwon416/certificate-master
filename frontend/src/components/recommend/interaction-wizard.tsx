/**
 * InteractionWizard Component
 *
 * 5단계 인터랙션 위자드 메인 컨테이너
 */
'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardProgress } from './wizard-progress'
import { WizardStep } from './wizard-step'
import {
  useRecommendStore,
  WIZARD_STEPS,
  areAllAnswersComplete,
  type WizardAnswers,
} from '@/stores/recommend-store'
import { useRecommendations } from '@/hooks/use-recommendations'

export function InteractionWizard() {
  const { currentStep, answers, setAnswer, nextStep, prevStep } = useRecommendStore()
  const { getRecommendations, isLoading } = useRecommendations()

  const currentStepConfig = WIZARD_STEPS[currentStep - 1]
  const isLastStep = currentStep === WIZARD_STEPS.length
  const isFirstStep = currentStep === 1
  const secondaryKey = currentStepConfig.secondaryKey

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
      const summary = answers.user_summary?.trim() ?? ''
      getRecommendations({
        purpose: answers.purpose!,
        interest_domains: selectedDomain,
        study_timeline: answers.study_timeline!,
        difficulty_preference: answers.difficulty_preference!,
        user_summary: summary || undefined,
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
    <div className="max-w-3xl mx-auto p-6 relative">
      {/* Progress */}
      <WizardProgress currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />

      {/* Step Content */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 mb-6">
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
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep || isLoading}
          className="px-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          이전
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canGoNext() || isLoading}
          className="px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              추천 중...
            </>
          ) : isLastStep ? (
            <>
              추천받기
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              다음
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-8 text-center max-w-md">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              추천 검색 중...
            </h3>
            <p className="text-slate-400 text-sm">
              AI가 당신에게 맞는 자격증을 찾고 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
