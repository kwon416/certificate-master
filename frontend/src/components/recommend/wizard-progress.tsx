/**
 * WizardProgress Component
 *
 * 위자드 진행 상태 표시
 */
'use client'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-4 md:mb-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <span className="text-xs md:text-sm text-muted-foreground">
          Step {currentStep}/{totalSteps}
        </span>
        <span className="text-xs md:text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
