import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostSummaries, formatDate, SITE_URL } from '@/lib/blog/posts'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '블로그 - 자격증 정보 & 시험 가이드',
  description:
    '정보처리기사, 전기기사 등 자격증 시험일정·합격률·공부법을 정리했습니다.',
  keywords: [
    '자격증 블로그',
    '자격증 시험일정',
    '자격증 공부법',
    '취업 자격증',
    '자격증 합격률',
    '자격증 가이드',
  ],
  openGraph: {
    title: '블로그 - 자격증 정보 & 시험 가이드 | 자격증 마스터',
    description:
      '정보처리기사, 전기기사 등 자격증 시험일정·합격률·공부법을 정리했습니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/blog`,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '자격증 마스터 블로그',
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
}

// 카테고리별 상단 강조 컬러
const categoryAccent: Record<string, string> = {
  '자격증 가이드': 'bg-emerald-500',
  '시험 일정':    'bg-blue-500',
  '자격증 추천':  'bg-purple-500',
  '합격 전략':    'bg-orange-500',
  '시험 정보':    'bg-cyan-500',
}

// 카테고리 배지 색상
const categoryBadge: Record<string, string> = {
  '자격증 가이드': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  '시험 일정':    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  '자격증 추천':  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  '합격 전략':    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
  '시험 정보':    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
}

export default function BlogPage() {
  const posts = getAllPostSummaries()

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* 헤더 */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          자격증 가이드
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-2 text-balance">
          자격증 정보 블로그
        </h1>
        <p className="text-base text-muted-foreground">
          시험일정·합격률·공부법, 자격증 준비에 필요한 핵심 정보만 모았습니다.
        </p>
      </header>

      {/* 포스트 그리드 */}
      <div
        data-testid="blog-posts-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {posts.map((post) => (
          <article
            key={post.slug}
            data-testid="blog-post-card"
            className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden card-hover"
          >
            {/* 카테고리 컬러 상단 강조선 */}
            <div
              className={`h-1 w-full ${categoryAccent[post.category] ?? 'bg-primary'}`}
              aria-hidden="true"
            />

            {/* 카드 본문 */}
            <div className="flex flex-col flex-1 p-5">
              {/* 카테고리 배지 */}
              <span
                data-testid="category-badge"
                className={`inline-block self-start px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${categoryBadge[post.category] ?? 'bg-muted text-muted-foreground'}`}
              >
                {post.category}
              </span>

              {/* 제목 — 카드 주인공 */}
              <h2 className="text-base font-bold leading-snug text-foreground mb-2.5 line-clamp-2 group-hover:text-primary transition-colors">
                <Link
                  href={`/blog/${post.slug}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {post.title}
                </Link>
              </h2>

              {/* 설명 — 2줄로 제한해 일관된 카드 높이 유지 */}
              <p
                data-testid="post-description"
                className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2"
              >
                {post.description}
              </p>
            </div>

            {/* 카드 푸터 */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
                <time dateTime={post.publishedAt} className="shrink-0">
                  {formatDate(post.publishedAt)}
                </time>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {post.readTime}분
                </span>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                data-testid="read-link"
                aria-label={`${post.title} 읽기`}
                className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline shrink-0 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                읽기
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
