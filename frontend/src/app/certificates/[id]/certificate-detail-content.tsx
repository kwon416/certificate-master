'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Clock,
  Building2,
  ExternalLink,
  Eye,
  Loader2,
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
  if (!level) return <span className="text-sm text-slate-500">정보 없음</span>

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= level
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-600'
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="text-slate-400 hover:text-white"
          >
            <Link href="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              검색으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center text-5xl">
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
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {cert.title}
              </h1>

              {/* View Count */}
              <div className="flex items-center gap-1.5 text-slate-400 mb-4">
                <Eye className="h-4 w-4" />
                <span className="text-sm">조회 {(cert.view_count ?? 0).toLocaleString()}회</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Difficulty */}
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-slate-500 mb-1">난이도</div>
                  <DifficultyStars level={cert.difficulty} />
                  <div className="text-xs text-slate-400 mt-1">
                    {getDifficultyLabel(cert.difficulty)}
                  </div>
                </div>

                {/* Study Period */}
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-slate-500 mb-1">준비기간</div>
                  {cert.study_period_days ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="text-lg font-bold text-white">
                        약 {Math.round(cert.study_period_days / 30)}개월
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">정보 없음</div>
                  )}
                </div>

                {/* Category */}
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-slate-500 mb-1">자격 분류</div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-slate-200 line-clamp-2">
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
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-cyan-400" />
                    공식 사이트 바로가기
                  </h3>
                  <p className="text-sm text-slate-300">
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-900/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="overview">한눈에 보기</TabsTrigger>
            <TabsTrigger value="exam">시험 정보</TabsTrigger>
            <TabsTrigger value="feasibility">합격 전략</TabsTrigger>
            <TabsTrigger value="career">취업 활용</TabsTrigger>
            <TabsTrigger value="study-guide">학습 가이드</TabsTrigger>
          </TabsList>

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
          <Card className="bg-gradient-to-r from-slate-900/80 to-slate-900/60 border-slate-800/60">
            <CardContent className="py-8 space-y-4">
              <h3 className="text-2xl font-bold text-white">
                {cert.title}에 대해 더 알아보세요
              </h3>
              <p className="text-slate-300">
                시험 일정, 난이도, 준비 기간을 확인하고 다른 자격증과 비교해 보세요.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 text-slate-200 hover:bg-slate-800"
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
