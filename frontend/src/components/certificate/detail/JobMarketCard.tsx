'use client'

import {
  Building2,
  Briefcase,
  TrendingUp,
  Award,
  BadgeCheck,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { JobMarketInfo } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface JobMarketCardProps {
  jobMarketInfo: JobMarketInfo
  className?: string
}

/**
 * JobMarketCard - 채용 시장 정보 카드
 *
 * 채용 빈도, 우대 기업, 공무원 가산점 등을 표시합니다.
 */
export function JobMarketCard({ jobMarketInfo, className }: JobMarketCardProps) {
  const hasAnyData =
    jobMarketInfo.job_posting_frequency ||
    jobMarketInfo.public_sector_points ||
    jobMarketInfo.requirement_type ||
    jobMarketInfo.salary_premium ||
    (jobMarketInfo.preferred_industries?.length ?? 0) > 0 ||
    (jobMarketInfo.preferred_companies?.length ?? 0) > 0

  if (!hasAnyData) return null

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-violet-400" />
          채용 시장 정보
        </CardTitle>
        <CardDescription>
          취업 시 자격증의 활용도와 가치
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* 채용공고 빈도 */}
          {jobMarketInfo.job_posting_frequency && (
            <div className="bg-violet-900/10 rounded-lg p-4 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-slate-400">채용 공고</span>
              </div>
              <span className="text-lg font-bold text-violet-400">
                {jobMarketInfo.job_posting_frequency}
              </span>
            </div>
          )}

          {/* 필수/우대 구분 */}
          {jobMarketInfo.requirement_type && (
            <div
              className={cn(
                'rounded-lg p-4 border',
                jobMarketInfo.requirement_type === '필수'
                  ? 'bg-emerald-900/10 border-emerald-500/20'
                  : 'bg-amber-900/10 border-amber-500/20'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-400">자격 요건</span>
              </div>
              <span
                className={cn(
                  'text-lg font-bold',
                  jobMarketInfo.requirement_type === '필수' ? 'text-emerald-400' : 'text-amber-400'
                )}
              >
                {jobMarketInfo.requirement_type}
              </span>
            </div>
          )}

          {/* 공무원/공기업 가산점 */}
          {jobMarketInfo.public_sector_points && (
            <div className="col-span-2 bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">공무원/공기업 가산점</span>
              </div>
              <span className="text-xl font-bold text-cyan-400">
                {jobMarketInfo.public_sector_points}
              </span>
            </div>
          )}

          {/* 연봉 프리미엄 */}
          {jobMarketInfo.salary_premium && (
            <div className="col-span-2 bg-amber-900/10 rounded-lg p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-slate-400">연봉 프리미엄</span>
              </div>
              <span className="text-xl font-bold text-amber-400">
                {jobMarketInfo.salary_premium}
              </span>
            </div>
          )}
        </div>

        {/* 우대 산업 */}
        {(jobMarketInfo.preferred_industries?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">우대 산업</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobMarketInfo.preferred_industries.map((industry, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-violet-500/30 text-violet-400"
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 우대 기업 */}
        {(jobMarketInfo.preferred_companies?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">우대 기업</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobMarketInfo.preferred_companies.slice(0, 10).map((company, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-emerald-900/20 text-emerald-400"
                >
                  {company}
                </Badge>
              ))}
              {jobMarketInfo.preferred_companies.length > 10 && (
                <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                  +{jobMarketInfo.preferred_companies.length - 10}개 더
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
