'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  TrendingUp, 
  Building2,
  AlertCircle,
  Loader2,
  Info,
  FileText,
  Target,
  CheckCircle,
  Users,
  Briefcase,
  DollarSign,
  BookOpen,
  ExternalLink,
  Award,
  MessageSquare,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCertificate } from '@/hooks'
import {
  hasExamInfo,
  hasCareerInfo,
  hasUserReviews,
  hasOfficialSources,
  hasStudyGuide,
  hasLectures,
} from '@/lib/api/types'

// Helper component for empty sections
function NoDataMessage({ message = '정보가 없습니다' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
      <Info className="h-5 w-5" />
      <span>{message}</span>
    </div>
  )
}

function DifficultyStars({ level }: { level: number | null | undefined }) {
  if (!level) return <NoDataMessage message="난이도 정보 없음" />
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= level
              ? 'h-4 w-4 fill-amber-400 text-amber-400'
              : 'h-4 w-4 text-slate-600'
          }
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

function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function SentenceSections({ text }: { text: string }) {
  const sentences = splitSentences(text)
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

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const certificateId = params.id as string

  const { data: cert, isLoading, error } = useCertificate(certificateId)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  // Error state
  if (error || !cert) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <EmptyState
            icon={AlertCircle}
            title="자격증을 불러올 수 없습니다"
            description="자격증 정보를 가져오는 중 문제가 발생했습니다."
            action={{
              label: '검색으로 돌아가기',
              onClick: () => router.push('/search'),
            }}
          />
        </div>
      </div>
    )
  }

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

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {cert.title}
              </h1>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Difficulty */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">난이도</div>
                  <DifficultyStars level={cert.difficulty} />
                  <div className="text-xs text-slate-400 mt-1">
                    {getDifficultyLabel(cert.difficulty)}
                  </div>
                </div>

                {/* Study Period */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">준비기간</div>
                  {cert.study_period_days ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-xl font-bold text-white">
                          약 {Math.round(cert.study_period_days / 30)}개월
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">정보 없음</div>
                  )}
                </div>

                {/* Category */}
                <div className="bg-slate-900/50 rounded-lg p-4 sm:col-span-2 md:col-span-1">
                  <div className="text-sm text-slate-500 mb-1">자격구분</div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-white line-clamp-2">
                      {cert.categories.map(c => c.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Official Site Button - Prominent CTA */}
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-900/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="exam">시험 정보</TabsTrigger>
            <TabsTrigger value="study-guide">학습 가이드</TabsTrigger>
            <TabsTrigger value="career">진로 & 활용</TabsTrigger>
            <TabsTrigger value="lectures">추천 강의</TabsTrigger>
            <TabsTrigger value="reviews">후기 & 팁</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
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

            {/* Official Sources */}
            {hasOfficialSources(cert) && (
              <Card className="bg-slate-900/50 border-slate-800/50 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-cyan-400" />
                    시험 정보
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
                      <div className="text-white">{cert.official_sources.issuing_organization}</div>
                    </div>
                  )}
                  {cert.official_sources.reference_urls.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-500 mb-2">참고 링크</div>
                      <ul className="space-y-2">
                        {cert.official_sources.reference_urls.map((url, idx) => (
                          <li key={idx}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 text-sm"
                            >
                              {url.includes('schedule') ? '📅 ' : url.includes('apply') ? '📝 ' : ''}
                              {url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exam Info Tab */}
          <TabsContent value="exam" className="mt-6 space-y-6">
            {/* Exam Subjects */}
            {hasExamInfo(cert) && (
              <>
                <Card className="bg-slate-900/50 border-slate-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      시험 과목
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cert.exam_info.subjects.length > 0 ? (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {cert.exam_info.subjects.map((subject, index) => (
                          <li key={index} className="flex items-start gap-2 bg-slate-800/30 p-3 rounded-lg">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span className="text-slate-300">{subject}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <NoDataMessage message="시험 과목 정보가 없습니다" />
                    )}
                  </CardContent>
                </Card>

                {/* Exam Type & Criteria */}
                <div className="grid md:grid-cols-2 gap-6">
                  {cert.exam_info.exam_type && (
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg">시험 형식</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">{cert.exam_info.exam_type}</p>
                      </CardContent>
                    </Card>
                  )}

                  {cert.exam_info.passing_criteria && (
                    <Card className="bg-slate-900/50 border-slate-800/50">
                      <CardHeader>
                        <CardTitle className="text-lg">합격 기준</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300">{cert.exam_info.passing_criteria}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Exam Fee */}
                {cert.exam_info.total_fee && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-400" />
                        응시료
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-amber-400">
                        {
                          (() => {
                            const fee = cert.exam_info.total_fee ?? ''
                            const feeStr = fee.toString().trim()
                            const normalized = feeStr.endsWith('원')
                              ? feeStr.slice(0, -1).trim()
                              : feeStr
                            const numericCandidate = normalized.replace(/,/g, '')
                            const isNumeric =
                              numericCandidate.length > 0 && !isNaN(Number(numericCandidate))
                            if (!isNumeric) {
                              return feeStr
                            }
                            const formatted = Number(numericCandidate).toLocaleString()
                            const shouldAppendWon = numericCandidate.endsWith('0')
                            return shouldAppendWon ? `${formatted}원` : formatted
                          })()
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!hasExamInfo(cert) && (
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="py-8">
                  <NoDataMessage message="시험 정보가 아직 등록되지 않았습니다" />
                </CardContent>
              </Card>
            )}
          </TabsContent>


          {/* Career Info Tab */}
          <TabsContent value="career" className="mt-6 space-y-6">
            {hasCareerInfo(cert) && (
              <>
                {/* Use Cases */}
                {cert.career_info.use_cases.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-emerald-400" />
                        활용 분야
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {cert.career_info.use_cases.map((useCase, idx) => (
                          <Badge key={idx} variant="outline" className="border-emerald-500/30 text-emerald-400">
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related Jobs */}
                {cert.career_info.related_jobs.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-cyan-400" />
                        관련 직업
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {cert.career_info.related_jobs.map((job, idx) => (
                          <div key={idx} className="bg-slate-800/30 p-3 rounded-lg text-center">
                            <span className="text-slate-300">{job}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Industry */}
                {cert.career_info.industry.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-violet-400" />
                        관련 산업
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {cert.career_info.industry.map((ind, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-violet-900/30 text-violet-400">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Average Salary */}
                {cert.career_info.average_salary && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-400" />
                        평균 연봉
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-amber-400">
                        {cert.career_info.average_salary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Job Prospects */}
                {cert.career_info.job_prospects && (
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
              </>
            )}

            {!hasCareerInfo(cert) && (
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="py-8">
                  <NoDataMessage message="진로 및 활용 정보가 아직 등록되지 않았습니다" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lectures Tab */}
          <TabsContent value="lectures" className="mt-6">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-400" />
                  추천 강의
                </CardTitle>
                <CardDescription>
                  AI가 분석한 관련성 높은 강의 목록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasLectures(cert) ? (
                  <div className="space-y-4">
                    {cert.recommended_lectures!
                      .sort((a, b) => b.relevance_score - a.relevance_score)
                      .map((lecture, idx) => (
                      <div key={idx} className="bg-slate-800/30 p-4 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                                {lecture.platform}
                              </Badge>
                              {lecture.relevance_score >= 0.8 && (
                                <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-400">
                                  추천
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-slate-200 font-medium mb-2">
                              {lecture.title}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                              {lecture.instructor && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {lecture.instructor}
                                </span>
                              )}
                              {lecture.price && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {lecture.price}
                                </span>
                              )}
                              {lecture.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {lecture.rating.toFixed(1)}
                                  {lecture.review_count && ` (${lecture.review_count})`}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={lecture.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button variant="outline" size="sm" className="border-emerald-500/30">
                              바로가기
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NoDataMessage message="추천 강의 정보가 아직 등록되지 않았습니다" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews & Tips Tab */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            {hasUserReviews(cert) && (
              <>
                {/* Summary */}
                {cert.user_reviews.summary && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-emerald-400" />
                        합격자 후기 요약
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SentenceSections text={cert.user_reviews.summary} />
                    </CardContent>
                  </Card>
                )}

                {/* Difficulty Feedback */}
                {cert.user_reviews.difficulty_feedback && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-400" />
                        난이도 평가
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 leading-relaxed">
                        {cert.user_reviews.difficulty_feedback}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Study Tips */}
                {cert.user_reviews.study_tips.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-emerald-400" />
                        학습 팁
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {cert.user_reviews.study_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-emerald-900/10 p-3 rounded-lg">
                            <Lightbulb className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Common Challenges */}
                {cert.user_reviews.common_challenges.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                        공통 어려움
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {cert.user_reviews.common_challenges.map((challenge, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 mt-1">⚠️</span>
                            <span className="text-slate-300">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!hasUserReviews(cert) && (
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="py-8">
                  <NoDataMessage message="후기 및 학습 팁 정보가 아직 등록되지 않았습니다" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Study Guide Tab */}
          <TabsContent value="study-guide" className="mt-6 space-y-6">
            {hasStudyGuide(cert) && (
              <>
                {/* Study Methods */}
                {cert.study_guide.study_methods.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-400" />
                        추천 공부 방법
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {cert.study_guide.study_methods.map((method, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-emerald-900/10 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300">{method}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Learning Sequence */}
                {cert.study_guide.learning_sequence.length > 0 && (
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
                        {cert.study_guide.learning_sequence.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-cyan-900/10 rounded-lg border border-cyan-500/20">
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

                {/* Time Allocation */}
                {cert.study_guide.time_allocation && (
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
                          <div className="p-4 bg-amber-900/10 rounded-lg text-center">
                            <p className="text-slate-400 text-sm mb-1">이론 학습</p>
                            <p className="text-2xl font-bold text-amber-400">{cert.study_guide.time_allocation.theory}</p>
                          </div>
                        )}
                        {cert.study_guide.time_allocation.practice && (
                          <div className="p-4 bg-emerald-900/10 rounded-lg text-center">
                            <p className="text-slate-400 text-sm mb-1">실전 문제</p>
                            <p className="text-2xl font-bold text-emerald-400">{cert.study_guide.time_allocation.practice}</p>
                          </div>
                        )}
                        {cert.study_guide.time_allocation.review && (
                          <div className="p-4 bg-cyan-900/10 rounded-lg text-center">
                            <p className="text-slate-400 text-sm mb-1">복습</p>
                            <p className="text-2xl font-bold text-cyan-400">{cert.study_guide.time_allocation.review}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Books */}
                {(cert.study_guide.recommended_books?.length ?? 0) > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                        추천 교재
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cert.study_guide.recommended_books?.map((book, idx) => (
                          <div key={idx} className="p-4 bg-purple-900/10 rounded-lg border border-purple-500/20">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-slate-200">{book.title}</h4>
                              {book.type && (
                                <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30">
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

                {/* Success Tips */}
                {cert.study_guide.success_tips.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-400" />
                        합격 팁
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {cert.study_guide.success_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-yellow-900/10 p-3 rounded-lg">
                            <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!hasStudyGuide(cert) && (
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="py-8">
                  <NoDataMessage message="학습 가이드 정보가 아직 등록되지 않았습니다" />
                </CardContent>
              </Card>
            )}
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
