/**
 * Server-side API utilities
 *
 * 서버 컴포넌트에서 사용할 fetch 유틸리티.
 * 브라우저 전용 API 클라이언트(client.ts)와 달리:
 * - 절대 URL 사용 (NEXT_PUBLIC_API_URL)
 * - 인증 불필요 (공개 API만 호출)
 * - Next.js fetch 캐싱 활용
 */

import { cache } from 'react'
import type { Certificate, CertificateList } from './types'

/**
 * 서버용 백엔드 API 기본 URL
 * Next.js rewrites를 통하지 않고 직접 백엔드에 요청
 *
 * Docker 환경에서는 INTERNAL_API_URL을 우선 사용하여
 * 컨테이너 간 통신이 가능하도록 함.
 */
function getBackendUrl(): string {
  const url = process.env.INTERNAL_API_URL
    || process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL 또는 INTERNAL_API_URL 환경변수가 설정되지 않았습니다.')
  }
  return url
}

/**
 * 자격증 상세 정보를 서버에서 fetch
 *
 * React.cache()로 감싸서 동일 request 내에서 generateMetadata와
 * page 컴포넌트가 같은 ID로 호출 시 1회만 fetch됨 (per-request dedup).
 *
 * @param id - 자격증 UUID
 * @returns Certificate 또는 null (에러/없음)
 */
export const fetchCertificateById = cache(async function fetchCertificateById(
  id: string
): Promise<Certificate | null> {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/certificates/${id}`, {
      next: { revalidate: 60 }, // 60초 캐싱
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[Server API] Failed to fetch certificate:', error)
    return null
  }
})

/**
 * 자격증 목록을 서버에서 fetch (인기순/전체)
 *
 * 홈페이지 SSR 내부 링크용. Google 크롤러가 자격증 상세 페이지를
 * 발견할 수 있도록 서버 렌더링 시점에 링크를 생성한다.
 *
 * @param pageSize - 가져올 개수 (기본 30)
 * @returns Certificate 배열 (에러 시 빈 배열)
 */
export const fetchCertificateList = cache(async function fetchCertificateList(
  pageSize: number = 30
): Promise<Pick<Certificate, 'id' | 'slug' | 'title' | 'categories' | 'difficulty'>[]> {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(
      `${backendUrl}/api/v1/certificates/search?page_size=${pageSize}&page=1`,
      { next: { revalidate: 3600 } } // 1시간 캐싱
    )

    if (!response.ok) {
      console.error(`[Server API] Certificate list fetch failed: ${response.status}`)
      return []
    }

    const data: CertificateList = await response.json()
    return data.items.map((cert) => ({
      id: cert.id,
      slug: cert.slug,
      title: cert.title,
      categories: cert.categories,
      difficulty: cert.difficulty,
    }))
  } catch (error) {
    console.error('[Server API] Failed to fetch certificate list:', error)
    return []
  }
})
