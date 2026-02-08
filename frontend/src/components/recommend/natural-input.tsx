/**
 * NaturalInput Component
 *
 * 자연어 기반 자격증 추천을 위한 입력 컴포넌트
 * 사용자가 자유롭게 상황을 설명하면 AI가 분석하여 추천합니다.
 */
'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Sparkles, Loader2, ArrowRight, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRecommendStore } from '@/stores/recommend-store'
import { useNaturalRecommendations } from '@/hooks/use-recommendations'

const MIN_LENGTH = 10
const MAX_LENGTH = 1000

const EXAMPLE_PROMPTS = [
  '비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.',
  '직장인인데 이직을 위해 데이터 분석 관련 자격증을 취득하고 싶어요. 주말에만 공부할 수 있습니다.',
  '경력 단절 후 재취업을 준비 중입니다. 사무직 관련 자격증 중에서 3개월 안에 취득 가능한 것을 찾고 있어요.',
]

export function NaturalInput() {
  const { naturalInput, setNaturalInput, setInputMode, isLoading } = useRecommendStore()
  const { getNaturalRecommendations } = useNaturalRecommendations()
  const [localInput, setLocalInput] = useState(naturalInput)

  useEffect(() => {
    setLocalInput(naturalInput)
  }, [naturalInput])

  const handleInputChange = (value: string) => {
    if (value.length <= MAX_LENGTH) {
      setLocalInput(value)
      setNaturalInput(value)
    }
  }

  const handleSubmit = () => {
    if (localInput.length >= MIN_LENGTH) {
      getNaturalRecommendations({ user_input: localInput })
    }
  }

  const handleExampleClick = (example: string) => {
    handleInputChange(example)
  }

  const isValidInput = localInput.length >= MIN_LENGTH

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full border border-emerald-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">AI 자연어 분석</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          상황을 자유롭게 설명해주세요
        </h2>
        <p className="text-slate-400">
          AI가 당신의 상황을 분석하여 맞춤 자격증을 추천해드립니다
        </p>
      </div>

      {/* Input Area */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 md:p-6 mb-4">
        <div className="relative">
          <Textarea
            placeholder="상황을 자유롭게 설명해주세요. 예: 비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다."
            value={localInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="min-h-[160px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none pr-4 pb-8"
            disabled={isLoading}
          />

          {/* Character Count */}
          <div className="absolute bottom-3 right-3 text-xs text-slate-500">
            <span className={localInput.length < MIN_LENGTH ? 'text-amber-400' : 'text-slate-400'}>
              {localInput.length}
            </span>
            <span className="text-slate-600"> / {MAX_LENGTH}</span>
          </div>
        </div>

        {/* Validation Hint */}
        <p className="text-xs text-slate-500 mt-2">
          {localInput.length < MIN_LENGTH ? (
            <span className="text-amber-400">10자 이상 입력해주세요 ({MIN_LENGTH - localInput.length}자 부족)</span>
          ) : (
            <span className="text-emerald-400">입력 완료! 추천받기 버튼을 눌러주세요</span>
          )}
        </p>
      </div>

      {/* Example Prompts */}
      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-3">예시 문장:</p>
        <div className="space-y-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left px-4 py-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-lg text-sm text-slate-400 hover:text-slate-300 transition-colors"
              disabled={isLoading}
            >
              <MessageSquare className="w-4 h-4 inline mr-2 text-slate-500" />
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => setInputMode('wizard')}
          disabled={isLoading}
          className="flex-1 h-12"
        >
          <ListChecks className="w-4 h-4 mr-2" />
          단계별로 선택하기
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValidInput || isLoading}
          className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI가 분석 중{'\u2026'}
            </>
          ) : (
            <>
              추천받기
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-8 text-center max-w-md mx-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              AI가 분석 중입니다{'\u2026'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              당신의 상황을 이해하고 맞춤 자격증을 찾고 있어요.
            </p>
            <div className="space-y-2 text-xs text-slate-500">
              <p>1. 상황 분석 중{'\u2026'}</p>
              <p>2. 조건에 맞는 자격증 검색 중{'\u2026'}</p>
              <p>3. 추천 이유 생성 중{'\u2026'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
