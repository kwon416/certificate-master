import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UseCaseCardProps {
  persona: string
  cert: string
  story: string
  result: string
  avatar: string
}

export default function UseCaseCard({ persona, cert, story, result, avatar }: UseCaseCardProps) {
  return (
    <Card
      data-testid="use-case-card"
      className="bg-slate-900/50 border-slate-800/50 hover:border-emerald-500/30 transition-[box-shadow,transform] duration-300"
    >
      <CardContent className="p-6">
        {/* Avatar */}
        <div className="text-4xl mb-4">{avatar}</div>

        {/* Persona & Certificate */}
        <div className="mb-4">
          <h4 className="text-white font-bold text-lg mb-1">{persona}</h4>
          <Badge variant="secondary" className="bg-slate-800 text-emerald-400 border-emerald-500/20">
            {cert}
          </Badge>
        </div>

        {/* Story */}
        <p className="text-slate-400 leading-relaxed mb-4 text-sm">
          &quot;{story}&quot;
        </p>

        {/* Result */}
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <span className="text-lg">✓</span>
          <span>{result}</span>
        </div>
      </CardContent>
    </Card>
  )
}
