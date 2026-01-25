/**
 * WizardStep Component
 *
 * 위자드 단계별 UI 렌더링
 */
'use client'

import { OptionCard } from './option-card'
import { TimeSlider } from './time-slider'
import { Input } from '@/components/ui/input'
import type { WizardAnswers } from '@/stores/recommend-store'

interface FieldOption {
  value: string
  label: string
  icon?: string
  description?: string
}

interface WizardStepProps {
  step: number
  title: string
  description: string
  answerKey: keyof WizardAnswers
  currentAnswer: WizardAnswers[keyof WizardAnswers]
  onAnswer: (value: WizardAnswers[keyof WizardAnswers]) => void
  options?: (string | FieldOption)[]
  secondaryAnswer?: WizardAnswers[keyof WizardAnswers]
  onSecondaryAnswer?: (value: WizardAnswers[keyof WizardAnswers]) => void
  secondaryOptions?: (string | FieldOption)[]
  type?: 'options' | 'slider' | 'input' | 'combo'
  min?: number
  max?: number
  sliderStep?: number
  placeholder?: string
}

export function WizardStep({
  title,
  description,
  currentAnswer,
  onAnswer,
  options,
  secondaryAnswer,
  onSecondaryAnswer,
  secondaryOptions,
  type = 'options',
  min = 0.5,
  max = 6,
  sliderStep = 0.5,
  placeholder,
}: WizardStepProps) {
  if (type === 'slider') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>

        <TimeSlider
          value={typeof currentAnswer === 'number' ? currentAnswer : Number(currentAnswer) || 2}
          onChange={(value) => onAnswer(String(value))}
          min={min}
          max={max}
          step={sliderStep}
        />
      </div>
    )
  }

  if (type === 'input') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>

        <div className="max-w-xl mx-auto space-y-3">
          <Input
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            placeholder={placeholder}
            onChange={(event) => {
              const nextValue = event.target.value
              onAnswer(nextValue.trim() ? nextValue : null)
            }}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>
    )
  }

  if (type === 'combo') {
    const timeUnspecified = currentAnswer === '-1'

    return (
      <div className="space-y-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>

        <div className="space-y-4">
          <TimeSlider
            value={timeUnspecified ? 2 : Number(currentAnswer) || 2}
            onChange={(value) => onAnswer(String(value))}
            min={min}
            max={max}
            step={sliderStep}
          />
          <div className="flex justify-center">
            <OptionCard
              label="상관없음"
              selected={timeUnspecified}
              onClick={() => onAnswer('-1')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">목표 기간</h3>
            <p className="text-sm text-slate-400">언제까지 취득하고 싶으세요?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {secondaryOptions?.map((option) => {
              if (typeof option === 'string') {
                return (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={secondaryAnswer === option}
                    onClick={() => onSecondaryAnswer?.(option)}
                  />
                )
              }
              return (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  description={option.description}
                  selected={secondaryAnswer === option.value}
                  onClick={() => onSecondaryAnswer?.(option.value)}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
        <p className="text-slate-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options?.map((option) => {
          // Handle both string and FieldOption types
          if (typeof option === 'string') {
            return (
              <OptionCard
                key={option}
                label={option}
                selected={currentAnswer === option}
                onClick={() => onAnswer(option)}
              />
            )
          } else {
            // FieldOption with icon support
            return (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                description={option.description}
                selected={currentAnswer === option.value}
                onClick={() => onAnswer(option.value)}
              />
            )
          }
        })}
      </div>
    </div>
  )
}
