# 추천 기능 도메인 필터링 + 상세 링크 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 추천 기능에서 선택한 분야와 관련된 자격증만 검색되도록 ChromaDB where 필터를 적용하고, 추천 결과에서 자격증 상세 페이지로 이동할 수 있는 링크를 추가한다.

**Architecture:** HybridSearchService의 Dense 검색에 `filter_dict={"domain": {"$in": domains}}` 파라미터를 전달하여 ChromaDB 네이티브 필터링을 적용한다. 프론트엔드는 인라인 결과 카드를 기존 `RecommendationCard` 컴포넌트로 교체하여 상세 링크를 제공한다.

**Tech Stack:** FastAPI, ChromaDB, Next.js 14, TypeScript

---

### Task 1: 백엔드 - Dense 검색 도메인 필터 테스트 작성

**Files:**
- Test: `backend/tests/unit/test_hybrid_search_service.py`

**Step 1: 도메인 필터 전달 테스트 작성**

`backend/tests/unit/test_hybrid_search_service.py`의 `TestRRFFusion` 클래스 끝에 추가:

```python
@pytest.mark.asyncio
async def test_dense_search_passes_domain_filter(self, service):
    """domains가 주어지면 Dense 검색에 filter_dict가 전달되는지 확인."""
    await service.search("테스트", top_k=5, domains=["IT/소프트웨어"])
    service._vector_store.search_records.assert_called_once_with(
        "certificates", "테스트", 15,
        filter_dict={"domain": {"$in": ["IT/소프트웨어"]}}
    )

@pytest.mark.asyncio
async def test_dense_search_no_filter_without_domains(self, service):
    """domains가 없으면 Dense 검색에 filter_dict가 전달되지 않는지 확인."""
    await service.search("테스트", top_k=5)
    service._vector_store.search_records.assert_called_once_with(
        "certificates", "테스트", 15,
        filter_dict=None
    )

@pytest.mark.asyncio
async def test_dense_search_no_filter_with_empty_domains(self, service):
    """domains가 빈 리스트면 filter_dict가 전달되지 않는지 확인."""
    await service.search("테스트", top_k=5, domains=[])
    service._vector_store.search_records.assert_called_once_with(
        "certificates", "테스트", 15,
        filter_dict=None
    )
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `cd backend && uv run pytest tests/unit/test_hybrid_search_service.py::TestRRFFusion::test_dense_search_passes_domain_filter tests/unit/test_hybrid_search_service.py::TestRRFFusion::test_dense_search_no_filter_without_domains tests/unit/test_hybrid_search_service.py::TestRRFFusion::test_dense_search_no_filter_with_empty_domains -v`

Expected: 3개 모두 FAIL (현재 `search_records`에 `filter_dict` 인자가 전달되지 않음)

---

### Task 2: 백엔드 - Dense 검색 도메인 필터 구현

**Files:**
- Modify: `backend/app/services/search/hybrid_search_service.py:50-56`

**Step 3: 최소 구현**

`hybrid_search_service.py`의 `search()` 메서드에서 Dense 검색 호출 부분을 수정:

```python
# Dense 검색용 도메인 필터 구성
dense_filter = {"domain": {"$in": domains}} if domains else None

# Dense(벡터) 검색과 Sparse(BM25) 검색을 병렬 실행
dense_results, sparse_results = await asyncio.gather(
    asyncio.to_thread(
        self._vector_store.search_records,
        self._vector_store.NAMESPACE,
        query,
        retrieve_k,
        filter_dict=dense_filter,
    ),
    asyncio.to_thread(
        self._bm25_service.search,
        query,
        retrieve_k,
        domains,
    ),
)
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `cd backend && uv run pytest tests/unit/test_hybrid_search_service.py -v`

Expected: 기존 테스트 포함 전체 PASS

**Note:** 기존 `test_search_records_called_with_namespace` 테스트는 `filter_dict` 인자 없이 호출을 검증하므로 수정이 필요함. `filter_dict=None`을 추가:

기존 95-97행:
```python
service._vector_store.search_records.assert_called_once_with(
    "certificates", "테스트", 15
)
```

수정:
```python
service._vector_store.search_records.assert_called_once_with(
    "certificates", "테스트", 15,
    filter_dict=None
)
```

**Step 5: 커밋**

```bash
git add backend/app/services/search/hybrid_search_service.py backend/tests/unit/test_hybrid_search_service.py
git commit -m "feat: add ChromaDB domain filter to dense search in HybridSearchService"
```

---

### Task 3: 프론트엔드 - 인라인 카드를 RecommendationCard로 교체

**Files:**
- Modify: `frontend/src/app/recommend/recommend-content.tsx:211-268`

**Step 6: RecommendationCard import 추가 및 인라인 카드 교체**

`recommend-content.tsx` 상단에 import 추가:
```typescript
import { RecommendationCard } from '@/components/recommend/recommendation-card'
```

결과 표시 영역 (211-268행)의 인라인 카드를 RecommendationCard로 교체:

기존:
```tsx
<div className="space-y-4">
  {unifiedRecommendations.map((rec, index) => (
    <div
      key={rec.certificate.id}
      className="p-6 bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl space-y-3"
    >
      {/* ... 인라인 카드 전체 ... */}
    </div>
  ))}
</div>
```

교체:
```tsx
<div className="space-y-4">
  {unifiedRecommendations.map((rec, index) => (
    <RecommendationCard
      key={rec.certificate.id}
      recommendation={{ ...rec, rank: index + 1 }}
    />
  ))}
</div>
```

**Step 7: 프론트엔드 빌드 확인**

Run: `cd frontend && npm run build`

Expected: 빌드 성공, 타입 에러 없음

**Step 8: 사용하지 않는 import 정리**

`recommend-content.tsx`에서 인라인 카드에만 사용되던 import가 있으면 제거. (현재 모든 import는 다른 곳에서도 사용 중이므로 추가 제거 없음)

**Step 9: 커밋**

```bash
git add frontend/src/app/recommend/recommend-content.tsx
git commit -m "feat: replace inline result cards with RecommendationCard component for detail links"
```

---

### Task 4: 통합 확인

**Step 10: 전체 백엔드 테스트 실행**

Run: `cd backend && uv run pytest tests/unit/test_hybrid_search_service.py -v`

Expected: 전체 PASS

**Step 11: 프론트엔드 빌드 확인**

Run: `cd frontend && npm run build`

Expected: 빌드 성공
