/**
 * NaturalResults Component
 *
 * 자연어 기반 추천 결과를 표시하는 컴포넌트
 * LLM이 분석한 구조화된 컨텍스트와 추천 결과를 보여줍니다.
 */
'use client'

import { RefreshCw, Brain, Target, Clock, BookOpen, Briefcase, Star, ChevronRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRecommendStore } from '@/stores/recommend-store'
import { cn } from '@/lib/utils'
import type { NaturalRecommendedCertificate, StructuredUserContext } from '@/lib/api/types'

// 난이도 레이블 매핑
const DIFFICULTY_LABELS: Record<number, string> = {
  1: '매우 쉬움',
  2: '쉬움',
  3: '보통',
  4: '어려움',
  5: '매우 어려움',
}

// 목표 아이콘 매핑
const GOAL_ICONS: Record<string, React.ReactNode> = {
  '취업': <Briefcase className="w-4 h-4" />,
  '이직': <RefreshCw className="w-4 h-4" />,
  '전문성 강화': <Star className="w-4 h-4" />,
  '개인 관심': <BookOpen className="w-4 h-4" />,
  '창업': <Target className="w-4 h-4" />,
}

interface StructuredContextCardProps {
  context: StructuredUserContext
}

function StructuredContextCard({ context }: StructuredContextCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-emerald-400" />
        <h3 className="font-semibold text-white">분석된 상황</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-slate-500">목표</span>
          <div className="flex items-center gap-1 text-white mt-1">
            {GOAL_ICONS[context.goal] || <Target className="w-4 h-4" />}
            <span>{context.goal}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-500">현재 상태</span>
          <p className="text-white mt-1">{context.employment_status}</p>
        </div>

        <div>
          <span className="text-slate-500">배경</span>
          <p className="text-white mt-1">{context.major_background}</p>
        </div>

        <div>
          <span className="text-slate-500">주당 학습</span>
          <div className="flex items-center gap-1 text-white mt-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{context.weekly_study_hours}시간</span>
          </div>
        </div>

        <div>
          <span className="text-slate-500">준비 기간</span>
          <p className="text-white mt-1">
            {context.max_study_period_days >= 365
              ? `${Math.round(context.max_study_period_days / 365)}년`
              : context.max_study_period_days >= 30
              ? `${Math.round(context.max_study_period_days / 30)}개월`
              : `${context.max_study_period_days}일`}
          </p>
        </div>

        <div>
          <span className="text-slate-500">난이도 선호</span>
          <p className="text-white mt-1">{context.difficulty_preference}</p>
        </div>
      </div>

      {context.preferred_industries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <span className="text-slate-500 text-sm">관심 분야</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {context.preferred_industries.map((industry, index) => (
              <Badge key={index} variant="outline" className="border-emerald-500/30 text-emerald-400">
                {industry}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: NaturalRecommendedCertificate
  rank: number
}

function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const { certificate, match_score, recommendation_reason, key_points, feasibility } = recommendation

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 md:p-6 hover:border-emerald-500/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
            {rank}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{certificate.title}</h3>
            <p className="text-sm text-slate-400">{recommendation.qualification_category}</p>
          </div>
        </div>

        <Badge
          className={cn(
            'text-sm font-semibold',
            match_score >= 80
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : match_score >= 60
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
          )}
        >
          {match_score}% 매치
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {certificate.difficulty && (
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            난이도 {DIFFICULTY_LABELS[certificate.difficulty] || certificate.difficulty}
          </Badge>
        )}
        {feasibility.estimated_days && (
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            예상 준비 {feasibility.estimated_days >= 30
              ? `${Math.round(feasibility.estimated_days / 30)}개월`
              : `${feasibility.estimated_days}일`}
          </Badge>
        )}
        {certificate.passing_rate && (
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            합격률 {certificate.passing_rate}%
          </Badge>
        )}
      </div>

      {/* Recommendation Reason */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-500 mb-1">추천 이유</p>
        <p className="text-slate-300 leading-relaxed">{recommendation_reason}</p>
      </div>

      {/* Key Points */}
      {key_points.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-slate-500 mb-2">핵심 포인트</p>
          <ul className="space-y-1">
            {key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                <span className="break-words whitespace-normal">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <Link href={`/certificates/${certificate.id}`}>
        <Button variant="outline" className="w-full mt-2">
          상세 정보 보기
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  )
}

export function NaturalResults() {
  const {
    structuredContext,
    naturalRecommendations,
    followUpQuestion,
    totalMatched,
    naturalInput,
    resetWizard,
  } = useRecommendStore()

  if (!naturalRecommendations) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* User Query Display */}
      {naturalInput && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 mb-1">내 요청</p>
              <p className="text-white">&quot;{naturalInput}&quot;</p>
            </div>
          </div>
        </div>
      )}

      {/* Structured Context */}
      {structuredContext && <StructuredContextCard context={structuredContext} />}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">추천 결과</h2>
          <p className="text-slate-400 text-sm">
            {totalMatched > 0
              ? `${totalMatched}개의 자격증 중 상위 추천`
              : '조건에 맞는 자격증을 찾지 못했습니다'}
          </p>
        </div>

        <Button variant="outline" onClick={resetWizard}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 추천받기
        </Button>
      </div>

      {/* Follow-up Question */}
      {followUpQuestion && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-400 text-sm">{followUpQuestion}</p>
        </div>
      )}

      {/* Recommendations */}
      {naturalRecommendations.length > 0 ? (
        <div className="space-y-4">
          {naturalRecommendations.map((rec, index) => (
            <RecommendationCard key={rec.certificate.id} recommendation={rec} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">추천 결과가 없습니다</p>
          <Button onClick={resetWizard}>
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 추천받기
          </Button>
        </div>
      )}
    </div>
  )
}
