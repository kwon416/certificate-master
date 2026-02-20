'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  ChevronRight,
  Star,
  Clock,
  Building2,
  ExternalLink,
  Eye,
  Loader2,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { hasOfficialSources } from '@/lib/api/types'
// OverviewTab은 기본 탭이므로 정적 import (초기 렌더에 필요)
import { OverviewTab } from '@/components/certificate/detail/tabs'
import { cn } from '@/lib/utils'
import type { Certificate } from '@/lib/api/types'

// 비활성 탭은 dynamic import로 lazy-load (Vercel Best Practice: bundle-dynamic-imports)
// 사용자가 탭 클릭 시에만 로드되어 초기 번들 사이즈 절감
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
  </div>
)

const ExamInfoTab = dynamic(
  () => import('@/components/certificate/detail/tabs/ExamInfoTab').then(m => m.ExamInfoTab),
  { loading: TabLoading }
)
const FeasibilityTab = dynamic(
  () => import('@/components/certificate/detail/tabs/FeasibilityTab').then(m => m.FeasibilityTab),
  { loading: TabLoading }
)
const CareerTab = dynamic(
  () => import('@/components/certificate/detail/tabs/CareerTab').then(m => m.CareerTab),
  { loading: TabLoading }
)
const StudyGuideTab = dynamic(
  () => import('@/components/certificate/detail/tabs/StudyGuideTab').then(m => m.StudyGuideTab),
  { loading: TabLoading }
)

function DifficultyStars({ level }: { level: number | null | undefined }) {
  if (!level) return <span className="text-sm text-muted-foreground">정보 없음</span>

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= level
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/50'
          )}
        />
      ))}
    </div>
  )
}

function getDifficultyLabel(level: number | null | undefined): string {
  if (!level) return '정보 없음'
  if (level <= 1) return '매우 쉬움'
  if (level <= 2) return '쉬움'
  if (level <= 3) return '보통'
  if (level <= 4) return '어려움'
  return '매우 어려움'
}

interface CertificateDetailContentProps {
  certificate: Certificate
}

export default function CertificateDetailContent({
  certificate: cert,
}: CertificateDetailContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const handleTabChange = useCallback((value: string) => {
    const url = new URL(window.location.href)
    if (value === 'overview') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', value)
    }
    router.replace(url.pathname + url.search, { scroll: false })
  }, [router])

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" data-testid="breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>자격증 검색</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </li>
            <li>
              <span aria-current="page" className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
                {cert.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center text-5xl">
                📜
              </div>
            </div>

            {/* Title & Meta */}
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cert.categories.map((cat, idx) => (
                  <Badge key={idx} variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {cat.name}
                  </Badge>
                ))}
                {cert.series && (
                  <Badge variant="secondary" className="bg-muted text-foreground/80">
                    {cert.series}
                  </Badge>
                )}
                {hasOfficialSources(cert) && cert.official_sources.issuing_organization && (
                  <Badge variant="secondary" className="bg-cyan-900/30 text-cyan-400 border-cyan-500/30">
                    {cert.official_sources.issuing_organization}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {cert.title}
              </h1>

              {/* View Count */}
              <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                <Eye className="h-4 w-4" />
                <span className="text-sm">조회 {(cert.view_count ?? 0).toLocaleString()}회</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Difficulty */}
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">난이도</div>
                  <DifficultyStars level={cert.difficulty} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {getDifficultyLabel(cert.difficulty)}
                  </div>
                </div>

                {/* Study Period */}
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">준비기간</div>
                  {cert.study_period_days ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="text-lg font-bold text-foreground">
                        약 {Math.round(cert.study_period_days / 30)}개월
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">정보 없음</div>
                  )}
                </div>

                {/* Category */}
                <div className="bg-card/50 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">자격 분류</div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-foreground line-clamp-2">
                      {cert.categories.length > 0
                        ? cert.categories[0].name
                        : '정보 없음'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Site Button */}
          {hasOfficialSources(cert) && cert.official_sources.official_site && (
            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 rounded-xl border border-cyan-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-cyan-400" />
                    공식 사이트 바로가기
                  </h3>
                  <p className="text-sm text-foreground/80">
                    📅 시험 일정, 접수 기간, 응시료 등 최신 정보를 공식 사이트에서 확인하세요
                  </p>
                </div>
                <a
                  href={cert.official_sources.official_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-cyan-500/20"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    확인하기
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4">
            <TabsList className="bg-card/50 p-1 flex-wrap h-auto w-full">
              <TabsTrigger value="overview">한눈에 보기</TabsTrigger>
              <TabsTrigger value="exam">시험 정보</TabsTrigger>
              <TabsTrigger value="feasibility">합격 전략</TabsTrigger>
              <TabsTrigger value="career">취업 활용</TabsTrigger>
              <TabsTrigger value="study-guide">학습 가이드</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab certificate={cert} />
          </TabsContent>

          <TabsContent value="exam" className="mt-6">
            <ExamInfoTab certificate={cert} />
          </TabsContent>

          <TabsContent value="feasibility" className="mt-6">
            <FeasibilityTab certificate={cert} />
          </TabsContent>

          <TabsContent value="career" className="mt-6">
            <CareerTab certificate={cert} />
          </TabsContent>

          <TabsContent value="study-guide" className="mt-6">
            <StudyGuideTab certificate={cert} />
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-card/80 to-card/60 border-border">
            <CardContent className="py-8 space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                {cert.title}에 대해 더 알아보세요
              </h3>
              <p className="text-foreground/80">
                시험 일정, 난이도, 준비 기간을 확인하고 다른 자격증과 비교해 보세요.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  asChild
                >
                  <Link href="/search">다른 자격증 찾아보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
