import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ValueCardProps {
  icon: LucideIcon
  result: string
  how: string
  proof: string
  gradient: string
}

export default function ValueCard({ icon: Icon, result, how, proof, gradient }: ValueCardProps) {
  return (
    <Card
      data-testid="value-card"
      className="group bg-slate-900/50 border-slate-800/50 hover:border-emerald-500/30 transition-[box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
    >
      <CardContent className="p-8">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} mb-6`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 leading-relaxed">
          {result}
        </h3>
        <p className="text-slate-400 mb-4 leading-relaxed">
          {how}
        </p>
        <Badge variant="secondary" className="bg-slate-800 text-emerald-400 border-emerald-500/20">
          {proof}
        </Badge>
      </CardContent>
    </Card>
  )
}
