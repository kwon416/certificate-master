import { create } from 'zustand'

interface SearchFilters {
  difficulty: [number, number]
  studyPeriod: string | null
  categories: string[] | null     // 복수 선택 지원 (category → categories)
  categoryCode: string | null     // 선택된 카테고리 코드
  series: string | null
}

interface SearchState {
  query: string
  filters: SearchFilters
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  resetFilters: () => void
}

const defaultFilters: SearchFilters = {
  difficulty: [1, 5],
  studyPeriod: null,
  categories: null,
  categoryCode: null,
  series: null,
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: defaultFilters,
  setQuery: (query) => set({ query: query.replace(/\s+/g, '') }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
        // categories 변경 시 series 리셋
        ...(filters.categories !== undefined &&
            JSON.stringify(filters.categories) !== JSON.stringify(state.filters.categories)
          ? { series: null }
          : {}
        ),
      },
    })),
  resetFilters: () => set({ filters: defaultFilters, query: '' }),
}))

