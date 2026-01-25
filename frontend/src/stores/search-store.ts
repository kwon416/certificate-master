import { create } from 'zustand'

interface SearchFilters {
  difficulty: [number, number]
  studyPeriod: string | null
  category: string | null
  series: string | null  // NEW: series filter
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
  category: null,
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
        // Reset series when category changes
        ...(filters.category !== undefined && filters.category !== state.filters.category
          ? { series: null }
          : {}
        )
      },
    })),
  resetFilters: () => set({ filters: defaultFilters, query: '' }),
}))

