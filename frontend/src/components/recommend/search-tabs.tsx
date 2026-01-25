/**
 * SearchTabs Component
 *
 * 추천받기 / 직접 검색 탭 전환
 */
'use client'

import { Sparkles, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SearchTabType = 'recommend' | 'search'

interface SearchTabsProps {
  activeTab: SearchTabType
  onTabChange: (tab: SearchTabType) => void
}

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl mb-8">
      <button
        role="tab"
        aria-selected={activeTab === 'recommend'}
        onClick={() => onTabChange('recommend')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
          activeTab === 'recommend'
            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        )}
      >
        <Sparkles className="w-5 h-5" />
        <span>추천받기</span>
      </button>

      <button
        role="tab"
        aria-selected={activeTab === 'search'}
        onClick={() => onTabChange('search')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
          activeTab === 'search'
            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        )}
      >
        <Search className="w-5 h-5" />
        <span>직접 검색</span>
      </button>
    </div>
  )
}
