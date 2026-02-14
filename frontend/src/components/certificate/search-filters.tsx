'use client'

import { useState, useEffect } from 'react'
import { Filter, RotateCcw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSearchStore } from '@/stores/search-store'
import { certificatesAPI } from '@/lib/api'
import type { CategoryInfo } from '@/lib/api/types'

const studyPeriods = [
  { value: 'all', label: '전체' },
  { value: '1', label: '1개월 이내' },
  { value: '3', label: '3개월 이내' },
  { value: '6', label: '6개월 이내' },
  { value: '12', label: '1년 이내' },
]

interface SearchFiltersProps {
  onFilterChange?: () => void
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const { filters, setFilters, resetFilters } = useSearchStore()
  const [isOpen, setIsOpen] = useState(false)
  const [categoryList, setCategoryList] = useState<CategoryInfo[]>([])
  const [availableSeries, setAvailableSeries] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingSeries, setIsLoadingSeries] = useState(false)

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await certificatesAPI.getCategories()
        setCategoryList(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Load series when category changes
  useEffect(() => {
    const loadSeries = async () => {
      const selectedCategory = filters.categories?.[0]
      if (!selectedCategory) {
        setAvailableSeries([])
        return
      }

      setIsLoadingSeries(true)
      try {
        // 새 API: category_name과 category_code 사용
        const data = await certificatesAPI.getSeries(selectedCategory, filters.categoryCode || undefined)

        // Find series for selected category
        const categoryData = data.find(d => d.category_name === selectedCategory)
        setAvailableSeries(categoryData?.series || [])
      } catch (error) {
        console.error('Failed to load series:', error)
        setAvailableSeries([])
      } finally {
        setIsLoadingSeries(false)
      }
    }
    loadSeries()
  }, [filters.categories, filters.categoryCode])

  const handleDifficultyChange = (value: number[]) => {
    if (value.length === 2) {
      setFilters({ difficulty: [value[0], value[1]] })
      onFilterChange?.()
    }
  }

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      setFilters({
        categories: null,
        categoryCode: null,
        series: null,
      })
    } else {
      // 선택된 카테고리의 코드 찾기
      const selectedCat = categoryList.find(c => c.name === value)
      setFilters({
        categories: [value],
        categoryCode: selectedCat?.code || null,
        series: null,
      })
    }
    onFilterChange?.()
  }

  const handleSeriesChange = (value: string) => {
    setFilters({ series: value === 'all' ? null : value })
    onFilterChange?.()
  }

  const handleStudyPeriodChange = (value: string) => {
    setFilters({ studyPeriod: value === 'all' ? null : value })
    onFilterChange?.()
  }

  const handleReset = () => {
    resetFilters()
    onFilterChange?.()
  }

  const activeFilterCount = [
    filters.difficulty[0] !== 1 || filters.difficulty[1] !== 5,
    filters.categories !== null && filters.categories.length > 0,
    filters.series !== null,
    filters.studyPeriod !== null,
  ].filter(Boolean).length

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter (Level 1) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">자격구분</label>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
            1단계
          </Badge>
        </div>
        <Select
          value={filters.categories?.[0] || 'all'}
          onValueChange={handleCategoryChange}
          disabled={isLoadingCategories}
        >
          <SelectTrigger className="bg-muted border-border text-foreground">
            <SelectValue placeholder={isLoadingCategories ? "로딩 중\u2026" : "자격구분 선택"} />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem
              value="all"
              className="text-foreground focus:bg-muted focus:text-foreground"
            >
              전체
            </SelectItem>
            {categoryList.map((cat) => (
              <SelectItem
                key={cat.code}
                value={cat.name}
                className="text-foreground focus:bg-muted focus:text-foreground"
              >
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Series Filter (Level 2 - only show when category selected) */}
      {filters.categories && filters.categories.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-emerald-400" />
            <label className="text-sm font-medium text-foreground">계열</label>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
              2단계
            </Badge>
          </div>
          <Select
            value={filters.series || 'all'}
            onValueChange={handleSeriesChange}
            disabled={isLoadingSeries || availableSeries.length === 0}
          >
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue
                placeholder={
                  isLoadingSeries
                    ? "로딩 중\u2026"
                    : availableSeries.length === 0
                    ? "계열 정보 없음"
                    : "계열 선택"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border max-h-[300px]">
              <SelectItem
                value="all"
                className="text-foreground focus:bg-muted focus:text-foreground"
              >
                전체
              </SelectItem>
              {availableSeries.map((series) => (
                <SelectItem
                  key={series}
                  value={series}
                  className="text-foreground focus:bg-muted focus:text-foreground"
                >
                  {series}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Study Period Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">준비기간</label>
        <Select
          value={filters.studyPeriod || 'all'}
          onValueChange={handleStudyPeriodChange}
        >
          <SelectTrigger className="bg-muted border-border text-foreground">
            <SelectValue placeholder="준비기간 선택" />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            {studyPeriods.map((period) => (
              <SelectItem
                key={period.value}
                value={period.value}
                className="text-foreground focus:bg-muted focus:text-foreground"
              >
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">난이도</label>
          <span className="text-sm text-muted-foreground">
            {filters.difficulty[0]} - {filters.difficulty[1]}
          </span>
        </div>
        <Slider
          value={filters.difficulty}
          min={1}
          max={5}
          step={1}
          onValueChange={handleDifficultyChange}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>쉬움</span>
          <span>어려움</span>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full border-border text-foreground/80 hover:bg-muted"
        onClick={handleReset}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        필터 초기화
      </Button>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">적용된 필터</div>
          <div className="flex flex-wrap gap-2">
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-400">
                {filters.categories[0]}
              </Badge>
            )}
            {filters.series && (
              <Badge variant="secondary" className="bg-cyan-900/30 text-cyan-400">
                {filters.series}
              </Badge>
            )}
            {filters.studyPeriod && (
              <Badge variant="secondary" className="bg-muted text-foreground/80">
                {studyPeriods.find(p => p.value === filters.studyPeriod)?.label}
              </Badge>
            )}
            {(filters.difficulty[0] !== 1 || filters.difficulty[1] !== 5) && (
              <Badge variant="secondary" className="bg-muted text-foreground/80">
                난이도 {filters.difficulty[0]}-{filters.difficulty[1]}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-6 rounded-xl bg-card/50 border border-border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              필터
            </h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button & Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="border-border text-foreground/80"
            >
              <Filter className="mr-2 h-4 w-4" />
              필터
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-emerald-500/20 text-emerald-400"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-background border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <Filter className="h-5 w-5" />
                필터
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
