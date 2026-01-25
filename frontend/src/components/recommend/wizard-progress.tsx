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
    <div className="mb-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">
          Step {currentStep}/{totalSteps}
        </span>
        <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
