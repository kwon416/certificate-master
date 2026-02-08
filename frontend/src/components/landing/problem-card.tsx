import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProblemCardProps {
  icon: LucideIcon
  text: string
  emotion: 'overwhelmed' | 'confused' | 'stressed' | 'demotivated'
}

const emotionColors = {
  overwhelmed: 'text-orange-400',
  confused: 'text-purple-400',
  stressed: 'text-red-400',
  demotivated: 'text-slate-400',
}

export default function ProblemCard({ icon: Icon, text, emotion }: ProblemCardProps) {
  return (
    <Card
      data-testid="problem-card"
      className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-[box-shadow,transform] duration-300 animate-slide-up"
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Icon className={`h-6 w-6 mt-1 flex-shrink-0 ${emotionColors[emotion]}`} />
          <p className="text-slate-300 leading-relaxed">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}
