'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 300

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="맨 위로 스크롤"
      className={cn(
        'fixed bottom-6 right-6 z-50 sm:hidden',
        'flex h-12 w-12 items-center justify-center rounded-full',
        'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
        'hover:bg-emerald-400 active:bg-emerald-600',
        'transition-[transform,opacity] duration-300',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
