'use client'

import {
  FileText,
  ExternalLink,
  Building2,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CostBreakdownCard } from '../CostBreakdownCard'
import { ExamScheduleCard } from '../ExamScheduleCard'
import { SimilarCertificatesTable } from '../SimilarCertificatesTable'
import {
  type Certificate,
  hasCostBreakdown,
  hasExamScheduleDetail,
  hasSimilarCertificates,
  hasOfficialSources,
} from '@/lib/api/types'

interface OverviewTabProps {
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
 * OverviewTab - 한눈에 보기 탭
 *
 * 핵심 지표 대시보드, 비용, 시험 일정, 유사 자격증을 표시합니다.
 */
export function OverviewTab({ certificate }: OverviewTabProps) {
  const cert = certificate

  return (
    <div className="space-y-6">
      {/* 자격증 개요 */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            자격증 개요
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cert.overview ? (
            <SentenceSections text={cert.overview} />
          ) : (
            <NoDataMessage message="자격증 설명이 제공되지 않습니다" />
          )}
        </CardContent>
      </Card>

      {/* 비용 상세 & 시험 일정 (2열 그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasCostBreakdown(cert) && (
          <CostBreakdownCard costBreakdown={cert.cost_breakdown} />
        )}
        {hasExamScheduleDetail(cert) && (
          <ExamScheduleCard scheduleDetail={cert.exam_schedule_detail} />
        )}
      </div>

      {/* 유사 자격증 비교 */}
      {hasSimilarCertificates(cert) && (
        <SimilarCertificatesTable certificates={cert.similar_certificates} />
      )}

      {/* 공식 출처 */}
      {hasOfficialSources(cert) && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-cyan-400" />
              공식 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cert.official_sources.official_site && (
              <div>
                <a
                  href={cert.official_sources.official_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-medium"
                >
                  {cert.official_sources.official_site}
                  <ExternalLink className="h-4 w-4" />
                </a>
                <p className="text-xs text-slate-400 mt-1">
                  최신 시험 일정, 접수 기간, 합격 발표일을 확인할 수 있습니다
                </p>
              </div>
            )}
            {cert.official_sources.issuing_organization && (
              <div>
                <div className="text-sm text-slate-500 mb-2">발급 기관</div>
                <div className="flex items-center gap-2 text-white">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {cert.official_sources.issuing_organization}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
