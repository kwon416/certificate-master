/**
 * OptionCard Component
 *
 * 위자드 단계에서 선택 가능한 옵션 카드
 */
'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  label: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  icon?: string  // Optional icon (emoji)
  description?: string
}

export function OptionCard({
  label,
  selected,
  onClick,
  disabled = false,
  icon,
  description,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative p-3 md:p-4 rounded-xl transition-all duration-200',
        'border-2 text-left w-full',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
        'active:scale-[0.98] touch-manipulation',
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {icon && (
            <span className="text-xl md:text-2xl flex-shrink-0" role="img" aria-label="icon">
              {icon}
            </span>
          )}
          <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
            <span
              className={cn(
                'text-base md:text-lg font-medium transition-colors truncate',
                selected ? 'text-emerald-400' : 'text-white'
              )}
            >
              {label}
            </span>
            {description && (
              <span className="text-xs md:text-sm text-slate-400 line-clamp-2">
                {description}
              </span>
            )}
          </div>
        </div>
        {selected && (
          <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}
