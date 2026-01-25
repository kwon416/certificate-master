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
        'relative p-4 rounded-xl transition-all duration-200',
        'border-2 text-left w-full',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <span className="text-2xl flex-shrink-0" role="img" aria-label="icon">
              {icon}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                'text-lg font-medium transition-colors',
                selected ? 'text-emerald-400' : 'text-white'
              )}
            >
              {label}
            </span>
            {description && (
              <span className="text-sm text-slate-400">
                {description}
              </span>
            )}
          </div>
        </div>
        {selected && (
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}
