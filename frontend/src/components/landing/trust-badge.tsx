import { LucideIcon } from 'lucide-react'

interface TrustBadgeProps {
  icon: LucideIcon
  text: string
}

export default function TrustBadge({ icon: Icon, text }: TrustBadgeProps) {
  return (
    <div
      data-testid="trust-badge"
      className="flex items-center gap-3 px-6 py-3 rounded-xl bg-muted/30 border border-border/50"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
        <Icon className="h-5 w-5 text-emerald-400" />
      </div>
      <span className="text-foreground/80 font-medium">{text}</span>
    </div>
  )
}
