import { LucideIcon, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LimitationCardProps {
  method: string
  issues: string[]
  icon: LucideIcon
}

export default function LimitationCard({ method, issues, icon: Icon }: LimitationCardProps) {
  return (
    <Card
      data-testid="limitation-card"
      className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300"
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mt-1">{method}</h3>
        </div>
        <ul className="space-y-2">
          {issues.map((issue, index) => (
            <li key={index} className="flex items-start gap-2">
              <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-400 text-sm leading-relaxed">{issue}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
