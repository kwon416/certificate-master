'use client'

import { DollarSign, Gift, ClipboardList, Youtube, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CostBreakdown } from '@/lib/api/types'
import { cn, isUrl, splitByUrls } from '@/lib/utils'

interface CostBreakdownCardProps {
  costBreakdown?: CostBreakdown | null
  certificateTitle?: string
  className?: string
}

/**
 * ResourceText - 무료 학습 자료 텍스트 렌더링
 *
 * URL이 포함된 텍스트는 새 탭에서 열리는 링크로 변환합니다.
 */
function ResourceText({ text }: { text: string }) {
  // 전체 문자열이 URL인 경우
  if (isUrl(text)) {
    return (
      <a
        href={text.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
      >
        {text.trim()}
      </a>
    )
  }

  // 텍스트 안에 URL이 포함된 경우
  const parts = splitByUrls(text)
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span>{text}</span>
  }

  return (
    <span>
      {parts.map((part, i) =>
        part.type === 'url' ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  )
}

/**
 * CostBreakdownCard - 시험 준비 카드
 *
 * 응시료와 무료 학습 자료, 유튜브 강의 검색을 표시합니다.
 */
export function CostBreakdownCard({ costBreakdown, certificateTitle, className }: CostBreakdownCardProps) {
  const hasExamFee = costBreakdown?.exam_fee
  const hasFreeResources = (costBreakdown?.free_resources?.length ?? 0) > 0

  const handleYoutubeSearch = () => {
    const query = encodeURIComponent(`${certificateTitle || '자격증'} 강의`)
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank')
  }

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-emerald-400" />
          시험 준비
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 응시료 */}
        {hasExamFee && (
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span className="text-slate-300">응시료</span>
            </div>
            <span className="font-medium text-white">{costBreakdown?.exam_fee}</span>
          </div>
        )}

        {/* 무료 학습 자료 */}
        {hasFreeResources && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">무료 학습 자료</span>
            </div>
            <ul className="space-y-1">
              {costBreakdown?.free_resources?.map((resource, idx) => (
                <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <ResourceText text={resource} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 유튜브 강의 검색 (항상 표시) */}
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">무료 강의 찾기</p>
                <p className="text-xs text-slate-400">유튜브에서 관련 강의를 검색해보세요</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleYoutubeSearch}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              검색
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
