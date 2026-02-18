# 추천 기능 도메인 필터링 강화 + 상세 링크 추가

**날짜**: 2026-02-18
**상태**: 승인됨

## 문제

1. Dense(벡터) 검색에서 선택한 분야 필터가 적용되지 않아, 무관한 자격증이 추천될 수 있음
2. 통합 추천 결과 페이지(`recommend-content.tsx`)에 자격증 상세 페이지 링크가 없음

## 해결 방안

### 백엔드: ChromaDB where 필터 적용

- `HybridSearchService.search()`에서 Dense 검색 시 `filter_dict={"domain": {"$in": domains}}` 전달
- BM25 도메인 후필터링은 기존 유지
- `domains=[]`(미선택) 시 필터 없이 기존 동작 유지

**변경 파일**: `backend/app/services/search/hybrid_search_service.py`

### 프론트엔드: RecommendationCard 컴포넌트 재사용

- `recommend-content.tsx`의 인라인 결과 카드를 기존 `RecommendationCard` 컴포넌트로 교체
- `RecommendationCard`에 이미 구현된 기능 활용:
  - 자격증 제목 클릭 → `/certificates/{slug || id}` 이동
  - "상세 정보 보기" 버튼
  - 추천 이유, 핵심 포인트, Quick Stats 표시

**변경 파일**: `frontend/src/app/recommend/recommend-content.tsx`
