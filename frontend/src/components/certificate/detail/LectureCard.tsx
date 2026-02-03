'use client'

import { Star, Users, DollarSign, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RecommendedLecture } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface LectureCardProps {
  lecture: RecommendedLecture
  className?: string
}

/**
 * LectureCard - 추천 강의 카드 컴포넌트
 *
 * 개별 강의 정보를 카드 형태로 표시합니다.
 */
export function LectureCard({ lecture, className }: LectureCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg transition-colors bg-slate-800/30 hover:bg-slate-800/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* 배지 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              {lecture.platform}
            </Badge>
          </div>

          {/* 제목 */}
          <h4 className="text-slate-200 font-medium mb-2 line-clamp-2">
            {lecture.title}
          </h4>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            {lecture.instructor && lecture.instructor !== 'null' && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {lecture.instructor}
              </span>
            )}
            {lecture.price && lecture.price !== '무료' && lecture.price !== 'null' && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {lecture.price}
              </span>
            )}
            {lecture.rating !== null && lecture.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {lecture.rating.toFixed(1)}
                {lecture.review_count && (
                  <span className="text-slate-500">({lecture.review_count.toLocaleString()})</span>
                )}
              </span>
            )}
          </div>

        </div>

        {/* 바로가기 버튼 */}
        <a
          href={lecture.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700"
          >
            바로가기
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      </div>
    </div>
  )
}

/**
 * LectureList - 강의 목록 래퍼 컴포넌트
 */
export function LectureList({
  lectures,
  className,
}: {
  lectures: RecommendedLecture[]
  className?: string
}) {
  // 관련성 점수로 정렬
  const sortedLectures = [...lectures].sort((a, b) => b.relevance_score - a.relevance_score)

  return (
    <div className={cn('space-y-4', className)}>
      {sortedLectures.map((lecture, idx) => (
        <LectureCard key={idx} lecture={lecture} />
      ))}
    </div>
  )
}
