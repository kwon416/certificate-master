import { LucideIcon } from 'lucide-react'

interface UsageStepProps {
  step: number
  title: string
  description: string
  icon: LucideIcon
}

export default function UsageStep({ step, title, description, icon: Icon }: UsageStepProps) {
  return (
    <div data-testid="usage-step" className="relative animate-slide-up">
      <div className="flex flex-col items-center text-center">
        {/* Step Number Circle */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-emerald-500/30">
            {step}
          </div>
        </div>

        {/* Icon Circle */}
        <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-emerald-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 leading-relaxed">
          {step}. {title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 leading-relaxed mb-4 max-w-xs">
          {description}
        </p>

        {/* Time Badge */}
        {/* <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          {time}
        </Badge> */}
      </div>
    </div>
  )
}
