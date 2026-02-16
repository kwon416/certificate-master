'use client'

import { cn } from '@/lib/utils'
import {
  Monitor, Zap, Building2, Wrench,
  FlaskConical, Coins, Heart, Shield,
  Utensils, Palette, Briefcase, MoreHorizontal,
} from 'lucide-react'

const DOMAINS = [
  { id: 'IT/소프트웨어', label: 'IT/소프트웨어', icon: Monitor },
  { id: '전기/전자', label: '전기/전자', icon: Zap },
  { id: '건설/건축', label: '건설/건축', icon: Building2 },
  { id: '기계/금속', label: '기계/금속', icon: Wrench },
  { id: '화학/환경', label: '화학/환경', icon: FlaskConical },
  { id: '금융/회계', label: '금융/회계', icon: Coins },
  { id: '의료/보건', label: '의료/보건', icon: Heart },
  { id: '안전/방재', label: '안전/방재', icon: Shield },
  { id: '식품/농업', label: '식품/농업', icon: Utensils },
  { id: '디자인/미디어', label: '디자인/미디어', icon: Palette },
  { id: '경영/사무', label: '경영/사무', icon: Briefcase },
  { id: '기타', label: '기타', icon: MoreHorizontal },
] as const

interface DomainSelectorProps {
  selected: string[]
  onSelect: (domains: string[]) => void
}

export function DomainSelector({ selected, onSelect }: DomainSelectorProps) {
  const toggleDomain = (domainId: string) => {
    if (selected.includes(domainId)) {
      onSelect(selected.filter((d) => d !== domainId))
    } else {
      onSelect([...selected, domainId])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          어떤 분야에 관심이 있으세요?
        </h2>
        <p className="text-muted-foreground text-sm">
          관심 분야를 선택해주세요 (복수 선택 가능)
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {DOMAINS.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggleDomain(id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600',
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
