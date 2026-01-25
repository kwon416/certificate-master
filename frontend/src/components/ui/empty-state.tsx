/**
 * Empty State Component
 * 
 * Displays when no data is available from API
 */

import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-slate-800/50 p-6 mb-4">
        <Icon className="h-12 w-12 text-slate-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

