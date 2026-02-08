/**
 * WizardStep Component
 *
 * 위자드 단계별 UI 렌더링
 */
'use client'

import { useState, KeyboardEvent } from 'react'
import { OptionCard } from './option-card'
import { TimeSlider } from './time-slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, MessageSquare } from 'lucide-react'
import { useRecommendStore, type WizardAnswers } from '@/stores/recommend-store'

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
  tertiaryAnswer?: WizardAnswers[keyof WizardAnswers]
  onTertiaryAnswer?: (value: WizardAnswers[keyof WizardAnswers]) => void
  tertiaryOptions?: (string | FieldOption)[]
  type?: 'options' | 'slider' | 'input' | 'combo' | 'enhanced-input' | 'input-with-natural'
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
  tertiaryAnswer,
  onTertiaryAnswer,
  tertiaryOptions,
  type = 'options',
  min = 0.5,
  max = 6,
  sliderStep = 0.5,
  placeholder,
}: WizardStepProps) {
  // 키워드 입력용 상태 (enhanced-input 타입에서 사용)
  const [keywordInput, setKeywordInput] = useState('')

  // 키워드 추가 핸들러
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim()
    if (!trimmed) return

    const currentKeywords = Array.isArray(secondaryAnswer) ? secondaryAnswer : []
    if (!currentKeywords.includes(trimmed) && currentKeywords.length < 5) {
      onSecondaryAnswer?.([...currentKeywords, trimmed])
      setKeywordInput('')
    }
  }

  // 키워드 삭제 핸들러
  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = Array.isArray(secondaryAnswer) ? secondaryAnswer : []
    onSecondaryAnswer?.(currentKeywords.filter((k) => k !== keyword))
  }

  // Enter 키 핸들러
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  if (type === 'slider') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
          <p className="text-sm md:text-base text-slate-400">{description}</p>
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
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
          <p className="text-sm md:text-base text-slate-400">{description}</p>
        </div>

        <div className="max-w-xl mx-auto space-y-3">
          <Input
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            placeholder={placeholder}
            onChange={(event) => {
              const nextValue = event.target.value
              onAnswer(nextValue.trim() ? nextValue : null)
            }}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-base"
          />
        </div>
      </div>
    )
  }

  // Step 4 자연어 통합 타입
  if (type === 'input-with-natural') {
    return <InputWithNaturalStep
      title={title}
      description={description}
      currentAnswer={currentAnswer}
      onAnswer={onAnswer}
      placeholder={placeholder}
    />
  }

  if (type === 'combo') {
    const timeUnspecified = currentAnswer === '-1'

    return (
      <div className="space-y-6 md:space-y-10">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
          <p className="text-sm md:text-base text-slate-400">{description}</p>
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

        <div className="space-y-3 md:space-y-4">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-white">목표 기간</h3>
            <p className="text-xs md:text-sm text-slate-400">언제까지 취득하고 싶으세요?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
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

  // 향상된 입력 타입: 자격증 등급 + 키워드 + 자유 입력
  if (type === 'enhanced-input') {
    const keywords = Array.isArray(secondaryAnswer) ? secondaryAnswer : []

    return (
      <div className="space-y-6 md:space-y-8">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
          <p className="text-sm md:text-base text-slate-400">{description}</p>
        </div>

        {/* 섹션 1: 자격증 등급 선호 */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-white">자격증 등급</h3>
            <p className="text-xs md:text-sm text-slate-400">선호하는 자격증 등급이 있나요?</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {options?.map((option) => {
              if (typeof option === 'string') {
                return (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={currentAnswer === option}
                    onClick={() => onAnswer(option)}
                    compact
                  />
                )
              }
              return (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={currentAnswer === option.value}
                  onClick={() => onAnswer(option.value)}
                  compact
                />
              )
            })}
          </div>
        </div>

        {/* 섹션 2: 관련 키워드 입력 */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-white">관련 키워드</h3>
            <p className="text-xs md:text-sm text-slate-400">
              찾고 싶은 자격증과 관련된 키워드를 입력하세요 (최대 5개)
            </p>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                placeholder="예: 전기, 용접, 회계\u2026"
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                disabled={keywords.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim() || keywords.length >= 5}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                추가
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="bg-emerald-900/50 text-emerald-300 border-emerald-700 px-3 py-1 text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      aria-label={`${keyword} 삭제`}
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 섹션 3: 자유 입력 (기존 user_summary) */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-white">추가 정보</h3>
            <p className="text-xs md:text-sm text-slate-400">
              더 구체적인 상황이나 목표가 있다면 알려주세요
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Input
              value={typeof tertiaryAnswer === 'string' ? tertiaryAnswer : ''}
              placeholder={placeholder || '예: 데이터 분석 직무로 이직하고 싶어요'}
              onChange={(e) => {
                const nextValue = e.target.value
                onTertiaryAnswer?.(nextValue.trim() ? nextValue : null)
              }}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-base"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center mb-4 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
        <p className="text-sm md:text-base text-slate-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 max-h-[50vh] md:max-h-none overflow-y-auto md:overflow-visible pr-1 md:pr-0">
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

// Step 4 자연어 통합 컴포넌트 (선택적 자연어 입력)
const MAX_NATURAL_LENGTH = 1000

const EXAMPLE_PROMPTS = [
  '비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다.',
  '직장인인데 이직을 위해 데이터 분석 관련 자격증을 취득하고 싶어요.',
  '경력 단절 후 재취업을 준비 중입니다. 3개월 안에 취득 가능한 것을 찾고 있어요.',
]

interface InputWithNaturalStepProps {
  title: string
  description: string
  currentAnswer: WizardAnswers[keyof WizardAnswers]
  onAnswer: (value: WizardAnswers[keyof WizardAnswers]) => void
  placeholder?: string
}

function InputWithNaturalStep({
  title,
  description,
}: InputWithNaturalStepProps) {
  const {
    naturalInputInWizard,
    setNaturalInputInWizard,
  } = useRecommendStore()

  const handleNaturalInputChange = (value: string) => {
    if (value.length <= MAX_NATURAL_LENGTH) {
      setNaturalInputInWizard(value)
    }
  }

  const handleExampleClick = (example: string) => {
    handleNaturalInputChange(example)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">{title}</h2>
        <p className="text-sm md:text-base text-slate-400">{description}</p>
      </div>

      {/* 자연어 입력 */}
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="relative">
          <Textarea
            value={naturalInputInWizard}
            onChange={(e) => handleNaturalInputChange(e.target.value)}
            placeholder="상황을 자유롭게 설명해주세요. AI가 분석하여 맞춤 자격증을 추천합니다."
            className="min-h-[140px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none pr-4 pb-8"
          />
          {/* 글자 수 카운터 */}
          <div className="absolute bottom-3 right-3 text-xs text-slate-500">
            <span className="text-slate-400">{naturalInputInWizard.length}</span>
            <span className="text-slate-600"> / {MAX_NATURAL_LENGTH}</span>
          </div>
        </div>

        {/* 힌트 */}
        <p className="text-xs text-slate-400">
          선택사항이에요. 건너뛰어도 됩니다.
        </p>

        {/* 예시 문장 */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">예시 문장:</p>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-lg text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <MessageSquare className="w-3 h-3 inline mr-2 text-slate-500" />
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
