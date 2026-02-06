'use client'

import {
  Briefcase,
  Award,
  Building2,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type Certificate,
  hasCareerInfo,
} from '@/lib/api/types'

interface CareerTabProps {
  certificate: Certificate
}

function NoDataMessage({ message = '정보가 없습니다' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
      <Info className="h-5 w-5" />
      <span>{message}</span>
    </div>
  )
}

/** 쉼표로 구분된 문자열을 개별 항목으로 분리 */
function splitItems(items: string[]): string[] {
  return items
    .flatMap((item) => item.split(/,\s*/))
    .map((s) => s.trim())
    .filter(Boolean)
}

function SentenceSections({ text }: { text: string }) {
  const sentences = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length === 0) return null

  return (
    <div className="space-y-3">
      {sentences.map((sentence, idx) => (
        <div key={`${sentence}-${idx}`} className="rounded-lg bg-slate-800/30 p-4">
          <p className="text-slate-300 leading-relaxed">{sentence}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * CareerTab - 취업 활용 탭
 *
 * 채용 시장 정보와 진로 정보를 표시합니다.
 */
export function CareerTab({ certificate }: CareerTabProps) {
  const cert = certificate
  const hasCareer = hasCareerInfo(cert)

  if (!hasCareer) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="py-8">
          <NoDataMessage message="진로 및 활용 정보가 아직 등록되지 않았습니다" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 활용 분야 */}
      {hasCareer && (cert.career_info?.use_cases?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-400" />
              활용 분야
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {splitItems(cert.career_info?.use_cases ?? []).map((useCase, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 text-sm px-3 py-1.5"
                >
                  {useCase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관련 직업 */}
      {hasCareer && (cert.career_info?.related_jobs?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-400" />
              관련 직업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {splitItems(cert.career_info?.related_jobs ?? []).map((job, idx) => (
                <div key={idx} className="bg-slate-800/30 p-3 rounded-lg text-center">
                  <span className="text-slate-300">{job}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관련 산업 */}
      {hasCareer && (cert.career_info?.industry?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-violet-400" />
              관련 산업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {splitItems(cert.career_info?.industry ?? []).map((ind, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-violet-900/30 text-violet-400 text-sm px-3 py-1.5"
                >
                  {ind}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 평균 연봉 */}
      {hasCareer && cert.career_info?.average_salary && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              평균 연봉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-amber-900/10 rounded-lg border border-amber-500/20 text-center">
              <p className="text-3xl font-bold text-amber-400">
                {cert.career_info.average_salary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 취업 전망 */}
      {hasCareer && cert.career_info?.job_prospects && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              취업 전망
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentenceSections text={cert.career_info.job_prospects} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
