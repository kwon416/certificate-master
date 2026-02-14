'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { certificatesAPI, type AutocompleteResult } from '@/lib/api'
import { useSearchStore } from '@/stores/search-store'

interface SearchInputProps {
  initialQuery?: string
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  autoFocus?: boolean
}

export function SearchInput({
  initialQuery = '',
  placeholder = '자격증을 검색하세요\u2026',
  className,
  onSearch,
  autoFocus = false,
}: SearchInputProps) {
  const { query, setQuery } = useSearchStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize with initialQuery if provided
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery)
    }
  }, [initialQuery, query, setQuery])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch autocomplete suggestions from API
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await certificatesAPI.autocomplete(query, 10)
        setSuggestions(results)
      } catch (error) {
        console.error('Autocomplete error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return
    
    setIsOpen(false)
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="자격증 검색"
          autocomplete="off"
          spellCheck={false}
          className="h-14 pl-12 pr-12 text-lg bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="검색어 지우기"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Screen reader announcement for autocomplete results */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isLoading && suggestions.length > 0
          ? `${suggestions.length}개 검색 결과`
          : !isLoading && query.length >= 2 && suggestions.length === 0
            ? '검색 결과 없음'
            : ''}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <Command className="bg-transparent">
            <CommandList>
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>검색 중\u2026</span>
                </div>
              )}

              {/* Suggestions */}
              {!isLoading && suggestions.length > 0 && (
                <CommandGroup heading="검색 결과" className="text-slate-500">
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSearch(suggestion.title)}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer text-slate-200 hover:bg-slate-800 aria-selected:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                          <span>{suggestion.title}</span>
                          {suggestion.series && suggestion.series !== suggestion.title && (
                            <span className="text-xs text-slate-500">{suggestion.series}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {suggestion.categories.map(c => c.name).join(', ')}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* No Results */}
              {!isLoading && query.length > 0 && suggestions.length === 0 && (
                <CommandEmpty className="py-6 text-center text-slate-400">
                  <p>&apos;{query}&apos;에 대한 검색 결과가 없습니다.</p>
                  <p className="text-sm mt-1">다른 검색어를 입력해보세요.</p>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
