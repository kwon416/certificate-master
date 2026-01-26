# Frontend Migration Guide: Certificate Categories Schema

**Date**: 2026-01-26
**Backend PR**: Certificate Categories Schema Migration

---

## Overview

백엔드 API가 `code`, `category` 단일 필드에서 `categories` JSON 배열로 마이그레이션되었습니다.
이 가이드는 프론트엔드 코드를 새 스키마에 맞게 업데이트하는 방법을 설명합니다.

### 주요 변경사항

| Before | After |
|--------|-------|
| `certificate.code` (string) | 삭제됨 - `categories[].code` 사용 |
| `certificate.category` (string) | 삭제됨 - `categories[].name` 사용 |
| `/search?category=X&code=Y` | `/search?categories=X&category_codes=Y` |
| `/categories` returns `string[]` | `/categories` returns `CategoryInfo[]` |
| `/series?category=X` | `/series?category_name=X&category_code=Y` |

---

## Phase 1: Type Definitions

### File: `src/lib/api/types.ts`

#### 1.1 Certificate Interface 수정

```diff
export interface Certificate {
  // Basic Info
  id: string
  raw_id: string
  title: string
  categories: CategoryInfo[]
- code: string                    // 삭제
  series: string | null
  // ... rest unchanged
}
```

#### 1.2 AutocompleteResult 수정 (변경 없음)

```typescript
// 이미 categories 배열 사용 중 - 변경 불필요
export interface AutocompleteResult {
  id: string
  title: string
  categories: { code: string; name: string }[]
  series?: string | null
}
```

#### 1.3 SeriesByCategory 수정

```diff
export interface SeriesByCategory {
- category: string
+ category_name: string
+ category_code: string
  series: string[]
}
```

#### 1.4 CategoryResponse 타입 추가

```typescript
// /categories 엔드포인트 응답용
export type CategoryResponse = CategoryInfo[]
```

---

## Phase 2: API Client

### File: `src/lib/api/certificates.ts`

#### 2.1 SearchCertificatesParams 수정

```diff
export interface SearchCertificatesParams {
  q?: string
- category?: string
- code?: string
+ categories?: string[]        // 복수 카테고리 지원
+ category_codes?: string[]    // 복수 코드 지원
  series?: string
  page?: number
  page_size?: number
}
```

#### 2.2 search() 함수 수정

```diff
async search(params: SearchCertificatesParams): Promise<CertificateList> {
  const searchParams = new URLSearchParams()

  if (params.q) searchParams.append('q', params.q)
- if (params.category) searchParams.append('category', params.category)
- if (params.code) searchParams.append('code', params.code)
+ if (params.categories) {
+   params.categories.forEach(cat => searchParams.append('categories', cat))
+ }
+ if (params.category_codes) {
+   params.category_codes.forEach(code => searchParams.append('category_codes', code))
+ }
  if (params.series) searchParams.append('series', params.series)
  // ... rest unchanged
}
```

#### 2.3 getCategories() 반환 타입 수정

```diff
- async getCategories(): Promise<string[]> {
+ async getCategories(): Promise<CategoryInfo[]> {
    const response = await apiClient.get('/api/v1/certificates/categories')
    return response.data
  }
```

#### 2.4 getSeries() 함수 수정

```diff
- async getSeries(category?: string): Promise<SeriesByCategory[]> {
+ async getSeries(categoryName?: string, categoryCode?: string): Promise<SeriesByCategory[]> {
    const params = new URLSearchParams()
-   if (category) params.append('category', category)
+   if (categoryName) params.append('category_name', categoryName)
+   if (categoryCode) params.append('category_code', categoryCode)

    const response = await apiClient.get(
      `/api/v1/certificates/series?${params.toString()}`
    )
    return response.data
  }
```

---

## Phase 3: Store Updates

### File: `src/stores/search-store.ts`

#### 3.1 SearchFilters 타입 수정

```diff
interface SearchFilters {
  query: string
- category: string | null
+ categories: string[] | null     // 복수 선택 지원
+ categoryCode: string | null     // 선택된 카테고리 코드
  series: string | null
}
```

#### 3.2 초기 상태 수정

```diff
const initialFilters: SearchFilters = {
  query: '',
- category: null,
+ categories: null,
+ categoryCode: null,
  series: null,
}
```

#### 3.3 setFilters 로직 수정

```diff
setFilters: (filters) =>
  set((state) => ({
    filters: {
      ...state.filters,
      ...filters,
-     // category 변경 시 series 리셋
-     ...(filters.category !== undefined && filters.category !== state.filters.category
+     // categories 변경 시 series 리셋
+     ...(filters.categories !== undefined &&
+         JSON.stringify(filters.categories) !== JSON.stringify(state.filters.categories)
        ? { series: null }
        : {}),
    },
  })),
```

---

## Phase 4: Component Updates

### 4.1 SearchFilters Component

**File: `src/components/certificate/search-filters.tsx`**

#### 카테고리 드롭다운 데이터 로딩 수정

```diff
const { data: categories } = useQuery({
  queryKey: ['categories'],
  queryFn: () => certificatesAPI.getCategories(),
})

// 드롭다운 옵션 생성
- const categoryOptions = categories?.map(cat => ({
-   value: cat,
-   label: cat,
- }))
+ const categoryOptions = categories?.map(cat => ({
+   value: cat.name,     // 또는 cat.code 기준으로 필터링
+   label: cat.name,
+   code: cat.code,
+ }))
```

#### getSeries 호출 수정

```diff
const { data: seriesData } = useQuery({
- queryKey: ['series', filters.category],
- queryFn: () => certificatesAPI.getSeries(filters.category || undefined),
- enabled: !!filters.category,
+ queryKey: ['series', filters.categories?.[0], filters.categoryCode],
+ queryFn: () => certificatesAPI.getSeries(
+   filters.categories?.[0] || undefined,
+   filters.categoryCode || undefined
+ ),
+ enabled: !!filters.categories?.length,
})
```

#### SeriesByCategory 데이터 접근 수정

```diff
// 계열 옵션 생성
- const currentCategorySeries = seriesData?.find(s => s.category === filters.category)
+ const currentCategorySeries = seriesData?.find(
+   s => s.category_name === filters.categories?.[0]
+ )
const seriesOptions = currentCategorySeries?.series.map(s => ({
  value: s,
  label: s,
}))
```

---

### 4.2 CertificateCard Component

**File: `src/components/certificate/certificate-card.tsx`**

#### 카테고리 아이콘 함수 수정

```diff
const getCategoryIcon = (categories: CategoryInfo[]): string => {
- const category = categories[0]?.name || ''
+ const categoryName = categories[0]?.name || ''
  const iconMap: Record<string, string> = {
    '국가기술자격': '🔧',
    '국가전문자격': '📋',
    '과정평가형자격': '📚',
    '일학습병행자격': '🏭',
  }
- return iconMap[category] || '📜'
+ return iconMap[categoryName] || '📜'
}
```

#### 카테고리 배지 렌더링 (변경 없음)

```typescript
// 이미 categories 배열 사용 중
{certificate.categories.map((cat, idx) => (
  <Badge key={idx} variant="secondary">
    {cat.name}
  </Badge>
))}
```

---

### 4.3 RecommendationCard Component

**File: `src/components/recommend/recommendation-card.tsx`**

변경 불필요 - 이미 `categories` 배열 사용 중

```typescript
// 기존 코드 유지
{certificate.categories.slice(0, 2).map((cat, idx) => (
  <span key={idx} className="tag">{cat.name}</span>
))}
```

---

## Phase 5: Hook Updates

### File: `src/hooks/use-certificates.ts`

#### 5.1 useCertificateCategories 반환 타입 수정

```diff
export function useCertificateCategories() {
  return useQuery({
    queryKey: certificateKeys.categories(),
    queryFn: () => certificatesAPI.getCategories(),
    staleTime: 1000 * 60 * 30, // 30분
-   // 반환: string[]
+   // 반환: CategoryInfo[]
  })
}
```

#### 5.2 Query key 구조 수정 (선택사항)

```diff
export const certificateKeys = {
  all: ['certificates'] as const,
- list: (params: SearchCertificatesParams) => [...certificateKeys.all, 'list', params] as const,
+ list: (params: SearchCertificatesParams) => [
+   ...certificateKeys.all,
+   'list',
+   {
+     ...params,
+     categories: params.categories?.sort(), // 정렬하여 캐시 키 일관성 유지
+   }
+ ] as const,
  // ...
}
```

---

## Phase 6: E2E Test Updates

### File: `tests/e2e/comprehensive.spec.ts`

#### 카테고리 필터 테스트 수정

```diff
test('should filter by category', async ({ page }) => {
  // 카테고리 선택
  await page.getByRole('combobox', { name: /자격구분/i }).click()
- await page.getByRole('option', { name: '국가기술자격' }).click()
+ await page.getByRole('option', { name: /국가기술자격/i }).click()

  // API 응답 검증
  await page.waitForResponse(response =>
-   response.url().includes('category=') &&
+   response.url().includes('categories=') &&
    response.status() === 200
  )
})
```

---

## Migration Checklist

### Types & Interfaces
- [ ] `Certificate` interface에서 `code` 필드 제거
- [ ] `SeriesByCategory`에 `category_name`, `category_code` 추가
- [ ] `SearchCertificatesParams`에서 `category` → `categories` 배열로 변경

### API Client
- [ ] `search()` 함수 파라미터 변경
- [ ] `getCategories()` 반환 타입 `CategoryInfo[]`로 변경
- [ ] `getSeries()` 파라미터 변경

### Store
- [ ] `SearchFilters` 타입 업데이트
- [ ] 초기 상태 업데이트
- [ ] Series 리셋 로직 업데이트

### Components
- [ ] `SearchFilters` 카테고리 드롭다운 수정
- [ ] `SearchFilters` 계열 드롭다운 수정
- [ ] `CertificateCard` 카테고리 표시 확인

### Hooks
- [ ] `useCertificateCategories` 반환 타입 확인

### Tests
- [ ] E2E 테스트 URL 파라미터 검증 수정
- [ ] 카테고리 선택 테스트 수정

---

## Backward Compatibility Notes

### 임시 호환성 유지 (선택사항)

마이그레이션 기간 동안 백엔드가 이전 파라미터도 지원하도록 할 수 있습니다:

```typescript
// API 호출 시 양쪽 파라미터 모두 전송
async search(params: SearchCertificatesParams) {
  const searchParams = new URLSearchParams()

  // 새 파라미터
  if (params.categories?.length) {
    params.categories.forEach(cat => searchParams.append('categories', cat))
  }

  // 레거시 지원 (임시)
  if (params.categories?.length === 1) {
    searchParams.append('category', params.categories[0])
  }

  // ...
}
```

---

## Testing Strategy

1. **Unit Tests**: 타입 변경 후 TypeScript 컴파일 확인
2. **Component Tests**: 카테고리 드롭다운 동작 확인
3. **E2E Tests**: 전체 검색 플로우 테스트
4. **Manual Testing**:
   - 카테고리 선택 → 계열 드롭다운 활성화
   - 검색 결과에 카테고리 배지 표시
   - 카테고리 변경 시 계열 리셋

---

## Rollback Plan

문제 발생 시:

1. 백엔드에서 레거시 엔드포인트 유지
2. 프론트엔드 변경 revert
3. 점진적 마이그레이션 재시도

---

## Questions?

마이그레이션 중 문제가 발생하면:
- Backend API 문서: `/docs` (Swagger)
- 이 가이드 작성자에게 문의
