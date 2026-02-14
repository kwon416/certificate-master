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
  compact?: boolean  // 작은 크기로 표시
}

export function OptionCard({
  label,
  selected,
  onClick,
  disabled = false,
  icon,
  description,
  compact = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-xl transition-[border-color,box-shadow,background-color] duration-200',
        'border-2 text-left w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
        'active:scale-[0.98] touch-manipulation',
        compact ? 'p-2 md:p-3' : 'p-3 md:p-4',
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-border hover:border-emerald-500 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={cn(
        'flex items-center gap-2',
        compact ? 'justify-center' : 'justify-between md:gap-3'
      )}>
        <div className={cn(
          'flex items-center gap-2 flex-1 min-w-0',
          compact && 'justify-center'
        )}>
          {icon && (
            <span
              className={cn(
                'flex-shrink-0',
                compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
              )}
              role="img"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className={cn(
            'flex flex-col min-w-0',
            compact ? 'gap-0' : 'gap-0.5 md:gap-1'
          )}>
            <span
              className={cn(
                'font-medium transition-colors truncate',
                compact ? 'text-sm md:text-base' : 'text-base md:text-lg',
                selected ? 'text-emerald-400' : 'text-foreground'
              )}
            >
              {label}
            </span>
            {description && !compact && (
              <span className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                {description}
              </span>
            )}
          </div>
        </div>
        {selected && !compact && (
          <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}
