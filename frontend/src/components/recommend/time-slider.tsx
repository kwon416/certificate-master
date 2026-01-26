/**
 * TimeSlider Component
 *
 * 하루 학습 시간 선택 슬라이더
 */
'use client'

import { Slider } from '@/components/ui/slider'

interface TimeSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export function TimeSlider({
  value,
  onChange,
  min = 0.5,
  max = 6,
  step = 0.5,
  disabled = false,
}: TimeSliderProps) {
  const handleChange = (values: number[]) => {
    onChange(values[0])
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Display selected value */}
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-1 md:mb-2">
          {value.toFixed(1)}
          <span className="text-xl md:text-2xl text-slate-400 ml-1 md:ml-2">시간</span>
        </div>
        <p className="text-xs md:text-sm text-slate-400">
          하루 {value.toFixed(1)}시간 × 주 5일 = 주당 {(value * 5).toFixed(1)}시간
        </p>
      </div>

      {/* Slider - 모바일에서 터치 영역 확대 */}
      <div className="px-2 py-2 touch-pan-x">
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 md:[&_[role=slider]]:h-4 md:[&_[role=slider]]:w-4"
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-slate-500 px-2">
        <span>{min}시간</span>
        <span>{max}시간</span>
      </div>
    </div>
  )
}
