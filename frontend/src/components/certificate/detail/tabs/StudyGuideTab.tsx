'use client'

import {
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  Award,
  Lightbulb,
  GraduationCap,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LectureList } from '../LectureCard'
import {
  type Certificate,
  hasStudyGuide,
  hasLectures,
  hasUserReviews,
} from '@/lib/api/types'

interface StudyGuideTabProps {
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

/**
 * StudyGuideTab - 학습 가이드 탭
 *
 * 공부법, 교재, 강의를 통합하여 표시합니다.
 */
export function StudyGuideTab({ certificate }: StudyGuideTabProps) {
  const cert = certificate
  const hasGuide = hasStudyGuide(cert)
  const hasLecs = hasLectures(cert)
  const hasReviews = hasUserReviews(cert)

  const hasAnyData = hasGuide || hasLecs

  if (!hasAnyData) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="py-8">
          <NoDataMessage message="학습 가이드 정보가 아직 등록되지 않았습니다" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 추천 공부 방법 */}
      {hasGuide && (cert.study_guide?.study_methods?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              추천 공부 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {cert.study_guide?.study_methods.map((method, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-emerald-900/10 p-3 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{method}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 학습 순서 */}
      {hasGuide && (cert.study_guide?.learning_sequence?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              학습 순서
            </CardTitle>
            <CardDescription>
              단계별로 학습하면 효과적으로 준비할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cert.study_guide?.learning_sequence.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-cyan-900/10 rounded-lg border border-cyan-500/20"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시간 배분 가이드 */}
      {hasGuide && cert.study_guide?.time_allocation && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              시간 배분 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cert.study_guide.time_allocation.theory && (
                <div className="p-4 bg-amber-900/10 rounded-lg text-center border border-amber-500/20">
                  <p className="text-slate-400 text-sm mb-1">이론 학습</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {cert.study_guide.time_allocation.theory}
                  </p>
                </div>
              )}
              {cert.study_guide.time_allocation.practice && (
                <div className="p-4 bg-emerald-900/10 rounded-lg text-center border border-emerald-500/20">
                  <p className="text-slate-400 text-sm mb-1">실전 문제</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {cert.study_guide.time_allocation.practice}
                  </p>
                </div>
              )}
              {cert.study_guide.time_allocation.review && (
                <div className="p-4 bg-cyan-900/10 rounded-lg text-center border border-cyan-500/20">
                  <p className="text-slate-400 text-sm mb-1">복습</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {cert.study_guide.time_allocation.review}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추천 교재 */}
      {hasGuide && (cert.study_guide?.recommended_books?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              추천 교재
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cert.study_guide?.recommended_books?.map((book, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-purple-900/10 rounded-lg border border-purple-500/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-200">{book.title}</h4>
                    {book.type && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-400"
                      >
                        {book.type}
                      </Badge>
                    )}
                  </div>
                  {book.publisher && (
                    <p className="text-sm text-slate-400 mb-2">출판사: {book.publisher}</p>
                  )}
                  {book.description && (
                    <p className="text-sm text-slate-300">{book.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추천 강의 */}
      {hasLecs && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
              추천 강의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LectureList lectures={cert.recommended_lectures!} />
          </CardContent>
        </Card>
      )}

      {/* 학습 팁 */}
      {hasReviews && (cert.user_reviews?.study_tips?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-400" />
              합격자 학습 팁
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {cert.user_reviews?.study_tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-emerald-900/10 p-3 rounded-lg"
                >
                  <Lightbulb className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 합격 팁 */}
      {hasGuide && (cert.study_guide?.success_tips?.length ?? 0) > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              합격을 위한 핵심 팁
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {cert.study_guide?.success_tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-yellow-900/10 p-3 rounded-lg"
                >
                  <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
