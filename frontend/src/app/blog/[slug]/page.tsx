import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Calendar, ChevronRight, ArrowLeft } from 'lucide-react'
import { getPostBySlug, getAllPostSlugs, formatDate, SITE_URL } from '@/lib/blog/posts'
import { BlogArticleJsonLd, JsonLd, createBreadcrumbData } from '@/components/seo'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPostSlugs().map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      locale: 'ko_KR',
      siteName: '자격증 마스터',
      url: `${SITE_URL}/blog/${post.slug}`,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
  }
}

// 카테고리 배지
const categoryBadge: Record<string, string> = {
  '자격증 가이드': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  '시험 일정':    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  '자격증 추천':  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  '합격 전략':    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
  '시험 정보':    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const breadcrumbData = createBreadcrumbData([
    { name: '홈', url: SITE_URL },
    { name: '블로그', url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ])

  return (
    <>
      <BlogArticleJsonLd post={post} />
      <JsonLd type="BreadcrumbList" data={breadcrumbData} />

      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {/* 브레드크럼 */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            홈
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <Link href="/blog" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            블로그
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="text-foreground font-medium truncate max-w-[240px] sm:max-w-xs">{post.title}</span>
        </nav>

        {/* 본문 + 사이드바 2컬럼 레이아웃 */}
        <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">

          {/* ── 메인 콘텐츠 ── */}
          <div className="min-w-0">

            {/* 포스트 헤더 */}
            <header className="mb-8 pb-6 border-b border-border">
              <span
                data-testid="post-category"
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${categoryBadge[post.category] ?? 'bg-muted text-muted-foreground'}`}
              >
                {post.category}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-4 leading-tight text-balance">
                {post.title}
              </h1>

              {/* 메타 정보 줄 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
                <span
                  data-testid="read-time"
                  className="flex items-center gap-1.5"
                >
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {post.readTime}분 읽기
                </span>
              </div>
            </header>

            {/* 모바일 목차 (lg 미만에서 표시) */}
            {post.toc.length > 0 && (
              <nav
                aria-label="목차"
                className="lg:hidden mb-8 p-4 rounded-xl border border-border bg-muted/30"
              >
                <p className="text-sm font-semibold text-foreground mb-3">목차</p>
                <ol className="space-y-2">
                  {post.toc.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="flex gap-2 text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        <span className="text-primary/70 font-medium tabular-nums shrink-0 w-4">{index + 1}.</span>
                        <span>{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* ─── 본문 ───
              blog-content: globals.css에서 정의한 커스텀 타이포그래피 스타일
              라이트/다크 모드 모두 올바른 대비를 유지 (CSS 변수 기반)
            */}
            <article className="blog-content">
              {post.content()}
            </article>

            {/* 하단 CTA */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  블로그 목록
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  자격증 검색하기
                </Link>
              </div>
            </div>
          </div>

          {/* ── 데스크탑 사이드바 ── */}
          {post.toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">

                {/* 목차 */}
                <nav
                  aria-label="목차"
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">목차</p>
                  <ol className="space-y-1.5">
                    {post.toc.map((item, index) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="flex gap-2 text-sm text-muted-foreground hover:text-primary transition-colors leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <span className="text-primary/60 font-medium tabular-nums shrink-0 w-4">{index + 1}.</span>
                          <span>{item.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* AI 추천 CTA */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground mb-1.5">
                    나에게 맞는 자격증 찾기
                  </p>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    AI가 분야·목표·경험 수준을 분석해 최적 자격증을 추천해 드립니다.
                  </p>
                  <Link
                    href="/recommend"
                    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    AI 추천 받기
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
