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
      className="bg-card/50 border-border hover:border-border transition-[box-shadow,border-color] duration-300"
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mt-1">{method}</h3>
        </div>
        <ul className="space-y-2">
          {issues.map((issue, index) => (
            <li key={index} className="flex items-start gap-2">
              <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground text-sm leading-relaxed">{issue}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
