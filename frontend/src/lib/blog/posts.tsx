import Link from 'next/link'
import { JSX } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export type BlogCategory =
  | '자격증 가이드'
  | '시험 일정'
  | '자격증 추천'
  | '합격 전략'
  | '시험 정보'

export interface BlogPost {
  slug: string
  title: string
  description: string
  keywords: string[]
  publishedAt: string // 'YYYY-MM-DD'
  updatedAt: string
  category: BlogCategory
  readTime: number // 분
  toc: Array<{ id: string; title: string }>
  content: () => JSX.Element
}

export type BlogPostSummary = Omit<BlogPost, 'content'>

// ──────────────────────────────────────────────────────────────────────────────
// 포스트: 취업을 위한 자격증 추천 TOP 5
// ──────────────────────────────────────────────────────────────────────────────
const post1: BlogPost = {
  slug: '취업-자격증-top5-2026',
  title: '취업을 위한 자격증 추천 TOP 5 (2026년 최신)',
  description:
    '2026년 취업·이직에 실질적으로 도움이 되는 자격증 TOP 5를 소개합니다. 난이도, 취업 분야, 준비 기간까지 한눈에 비교해 나에게 맞는 자격증을 찾아보세요.',
  keywords: [
    '취업 자격증 추천',
    '취업 자격증 추천 2026',
    '이직 자격증',
    '자격증 추천',
    '취업에 유리한 자격증',
    '자격증 취업',
    '국가자격증 추천',
    '자격증 난이도',
  ],
  publishedAt: '2026-02-01',
  updatedAt: '2026-02-15',
  category: '자격증 추천',
  readTime: 7,
  toc: [
    { id: 'intro', title: '취업 자격증 선택 기준' },
    { id: 'top1', title: '1위: 정보처리기사 (IT 개발)' },
    { id: 'top2', title: '2위: 전기기사 (전기·에너지)' },
    { id: 'top3', title: '3위: 산업안전기사 (안전관리)' },
    { id: 'top4', title: '4위: 회계사/세무사 보조 자격 (사무·회계)' },
    { id: 'top5', title: '5위: 건축기사 (건설·건축)' },
    { id: 'how-to-choose', title: '나에게 맞는 자격증 고르는 법' },
  ],
  content: () => (
    <>
      <h2 id="intro">취업 자격증 선택 기준</h2>
      <p>
        모든 자격증이 취업에 도움이 되는 건 아닙니다. 취업·이직에 실질적인 효과를 내는 자격증을 고르는
        기준 세 가지를 먼저 확인하세요.
      </p>
      <ul>
        <li>
          <strong>채용 공고에서의 빈도</strong>: 채용 시장에서 실제로 요구되거나 우대되는 자격증
        </li>
        <li>
          <strong>취득 난이도 대비 효과</strong>: 준비 기간 대비 취업·연봉 상승 효과
        </li>
        <li>
          <strong>분야 적합성</strong>: 자신이 가고자 하는 직무·산업과의 연관성
        </li>
      </ul>

      <h2 id="top1">1위: 정보처리기사 (IT 개발·운영)</h2>
      <p>
        IT 직군 채용 공고의 약 60% 이상에서 우대 또는 필수 조건으로 명시됩니다. 개발자, 시스템관리자,
        데이터 엔지니어 등 폭넓은 IT 직무에서 인정받습니다.
      </p>
      <ul>
        <li>
          <strong>준비 기간</strong>: 전공자 1~3개월, 비전공자 3~6개월
        </li>
        <li>
          <strong>연간 응시 기회</strong>: 3회
        </li>
        <li>
          <strong>취업 분야</strong>: IT 전 분야
        </li>
      </ul>
      <p>
        <Link href="/certificates/정보처리기사" className="text-primary underline">
          정보처리기사 상세 정보 →
        </Link>
      </p>

      <h2 id="top2">2위: 전기기사 (전기·에너지·공공기관)</h2>
      <p>
        한국전력공사, 발전 공기업, 건설사, 전기 시공업체에서 필수 자격증으로 꼽힙니다. 공공기관 취업
        시 가산점도 부여됩니다.
      </p>
      <ul>
        <li>
          <strong>준비 기간</strong>: 6개월~1년
        </li>
        <li>
          <strong>취업 분야</strong>: 한전, 공기업, 건설사 전기팀, 전기 시공업
        </li>
        <li>
          <strong>연봉 효과</strong>: 전기직 공무원 가산점, 전기공사업 면허 요건 충족
        </li>
      </ul>

      <h2 id="top3">3위: 산업안전기사 (안전관리·공공기관)</h2>
      <p>
        산업안전보건법 강화로 모든 제조업·건설업·물류업 사업장에서 안전관리자 의무 채용이 늘고
        있습니다. 안정적인 수요가 보장된 자격증입니다.
      </p>
      <ul>
        <li>
          <strong>준비 기간</strong>: 3~6개월
        </li>
        <li>
          <strong>취업 분야</strong>: 제조업, 건설업, 물류, 공공기관
        </li>
        <li>
          <strong>시장 전망</strong>: 안전 규제 강화로 꾸준한 수요 증가
        </li>
      </ul>

      <h2 id="top4">4위: ERP·회계 관련 자격 (사무·금융·회계)</h2>
      <p>
        전산세무회계, ERP정보관리사, 재경관리사 등 회계·경영 직군에서 공인 자격증은 서류 통과율을
        높여 줍니다. 특히 중소기업 경영지원팀, 세무법인, 금융기관에서 선호합니다.
      </p>
      <ul>
        <li>
          <strong>준비 기간</strong>: 1~3개월 (자격 종류에 따라 다름)
        </li>
        <li>
          <strong>취업 분야</strong>: 회계·세무·재무, 금융, 경영지원
        </li>
      </ul>

      <h2 id="top5">5위: 건축기사 (건설·건축·인테리어)</h2>
      <p>
        건설업 호황과 재건축·인테리어 수요로 건축기사 수요가 꾸준합니다. 건설사, 설계사무소,
        감리회사에서 필수 자격으로 요구합니다.
      </p>
      <ul>
        <li>
          <strong>준비 기간</strong>: 6개월~1년
        </li>
        <li>
          <strong>취업 분야</strong>: 건설사, 설계사무소, 감리, 인테리어
        </li>
      </ul>

      <h2 id="how-to-choose">나에게 맞는 자격증 고르는 법</h2>
      <p>
        자격증 선택이 어렵다면, 희망 직무·분야·경험 수준을 입력하면 AI가 맞춤 자격증을 추천해 주는
        서비스를 활용해 보세요.
      </p>
      <ul>
        <li>
          <Link href="/recommend" className="text-primary underline">
            AI 자격증 추천받기 →
          </Link>
        </li>
        <li>
          <Link href="/" className="text-primary underline">
            600+ 자격증 검색하기 →
          </Link>
        </li>
      </ul>
    </>
  ),
}

// ──────────────────────────────────────────────────────────────────────────────
// 모든 포스트
// ──────────────────────────────────────────────────────────────────────────────
const allPosts: BlogPost[] = [post1]

/**
 * 슬러그로 포스트 조회 (상세 페이지용)
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((post) => post.slug === slug)
}

/**
 * 모든 포스트 요약 반환 (content 제외, 날짜 내림차순)
 * 목록 페이지용
 */
export function getAllPostSummaries(): BlogPostSummary[] {
  return allPosts
    .map(({ content: _content, ...rest }) => rest)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * 모든 포스트의 슬러그 + updatedAt 반환
 * sitemap용
 */
export function getAllPostSlugs(): Array<{ slug: string; updatedAt: string }> {
  return allPosts.map(({ slug, updatedAt }) => ({ slug, updatedAt }))
}

/**
 * 날짜 포맷 헬퍼 (YYYY-MM-DD → 한국어 날짜)
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export { SITE_URL }
