'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number | null
  subValue?: string | null
  colorScheme?: 'emerald' | 'cyan' | 'amber' | 'violet' | 'purple' | 'slate'
  className?: string
}

const colorMap = {
  emerald: {
    icon: 'text-emerald-400',
    value: 'text-emerald-400',
    bg: 'bg-emerald-900/10',
    border: 'border-emerald-500/20',
  },
  cyan: {
    icon: 'text-cyan-400',
    value: 'text-cyan-400',
    bg: 'bg-cyan-900/10',
    border: 'border-cyan-500/20',
  },
  amber: {
    icon: 'text-amber-400',
    value: 'text-amber-400',
    bg: 'bg-amber-900/10',
    border: 'border-amber-500/20',
  },
  violet: {
    icon: 'text-violet-400',
    value: 'text-violet-400',
    bg: 'bg-violet-900/10',
    border: 'border-violet-500/20',
  },
  purple: {
    icon: 'text-purple-400',
    value: 'text-purple-400',
    bg: 'bg-purple-900/10',
    border: 'border-purple-500/20',
  },
  slate: {
    icon: 'text-muted-foreground',
    value: 'text-foreground',
    bg: 'bg-muted/50',
    border: 'border-border',
  },
}

/**
 * StatCard - 핵심 지표를 표시하는 카드 컴포넌트
 *
 * 사용 예:
 * <StatCard
 *   icon={TrendingUp}
 *   label="합격률"
 *   value="45%"
 *   colorScheme="emerald"
 * />
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  colorScheme = 'slate',
  className,
}: StatCardProps) {
  const colors = colorMap[colorScheme]

  // 값이 없으면 표시하지 않음
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border transition-colors',
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', colors.icon)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold', colors.value)}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
      )}
    </div>
  )
}

/**
 * StatCardGrid - StatCard를 그리드로 배치하는 래퍼 컴포넌트
 */
export function StatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
}
