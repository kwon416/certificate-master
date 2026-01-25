/**
 * API Types
 * 
 * Type definitions for backend API responses.
 * Updated to match Backend Schema V2 (2026-01-06)
 */

// ==================== Certificate Related Types ====================

// ExamSchedule and Eligibility removed - users should check official sources for these

/**
 * 진로 및 활용 정보
 */
export interface CareerInfo {
  use_cases: string[]          // 활용 분야
  related_jobs: string[]       // 관련 직업
  average_salary?: string | null  // 평균 연봉
  job_prospects?: string | null   // 취업 전망
  industry: string[]           // 관련 산업
}

/**
 * 실제 후기 요약
 */
export interface UserReviews {
  summary?: string | null              // 전체 요약
  difficulty_feedback?: string | null  // 난이도 평가
  study_tips: string[]                 // 학습 팁
  common_challenges: string[]          // 공통 어려움
}

/**
 * 공식 출처 정보
 */
export interface OfficialSources {
  official_site?: string | null        // 공식 사이트
  issuing_organization?: string | null // 발급 기관
  reference_urls: string[]             // 참고 링크
}

/**
 * 시험 정보 상세 구조
 */
export interface ExamInfo {
  subjects: string[]           // 시험 과목
  exam_type: string            // 시험 형식 (필기/실기/면접)
  passing_criteria: string     // 합격 기준
  total_fee?: string | null    // 총 응시료 (원)
}

/**
 * 추천 강의 구조 (V2 Enhanced)
 */
export interface RecommendedLecture {
  platform: string                    // 플랫폼명 (에듀윌, 해커스 등)
  title: string                       // 강의명
  url: string                         // 강의 링크
  instructor?: string | null          // 강사명
  price?: string | null               // 가격 (예: '150000원', '무료')
  rating?: number | null              // 평점 (0-5)
  review_count?: number | null        // 리뷰 수
  relevance_score: number             // 관련성 점수 (0-1, LLM 평가)
}

/**
 * 학습 시간 배분 정보
 */
export interface TimeAllocation {
  theory?: string | null     // 이론 학습 비율 (예: "40%")
  practice?: string | null   // 실전 문제 비율 (예: "50%")
  review?: string | null     // 복습 비율 (예: "10%")
}

/**
 * 추천 교재 정보
 */
export interface RecommendedBook {
  title: string              // 교재명
  publisher?: string | null  // 출판사
  type?: string | null       // 교재 유형 (필기/실기/종합)
  description?: string | null // 교재 설명
}

/**
 * 학습 가이드 정보
 */
export interface StudyGuide {
  study_methods: string[]              // 추천 공부 방법
  learning_sequence: string[]          // 단계별 학습 순서
  time_allocation?: TimeAllocation | null  // 시간 배분 가이드
  recommended_books: RecommendedBook[] // 추천 교재 목록
  success_tips: string[]               // 합격을 위한 핵심 팁
}

/**
 * 카테고리 정보
 */
export interface CategoryInfo {
  code: string    // T, S, Q, W 등
  name: string    // 국가기술자격, 국가전문자격 등
}

/**
 * 자격증 상세 정보 (V2)
 */
export interface Certificate {
  // Basic Info
  id: string
  raw_id: string
  title: string
  categories: CategoryInfo[]             // 복수 카테고리 지원 (객체 배열)
  code: string
  series: string | null
  qualification_type?: string | null    // 자격 구분 (국가/공인/민간 등)
  created_at: string
  updated_at: string
  
  // Core Enriched Fields (Level 1: 필수)
  overview?: string | null              // 자격증 개요 (3-5문장)
  difficulty?: number | null            // 난이도 (1-5)
  study_period_days?: number | null     // 권장 준비기간 (일)
  
  // Exam Related (Level 1)
  exam_info?: ExamInfo                  // 시험 정보 상세
  
  // Learning & Lectures (Level 2)
  recommended_lectures?: RecommendedLecture[]  // 추천 강의 목록
  
  // Career & Reviews (Level 3)
  career_info?: CareerInfo              // 진로 정보
  user_reviews?: UserReviews            // 후기 요약

  // Study Guide (Level 2)
  study_guide?: StudyGuide              // 학습 가이드

  // Official Sources (Level 2)
  official_sources?: OfficialSources    // 공식 출처

  // Statistics
  passing_rate?: number | null          // 합격률 (%)
}

/**
 * 자격증 목록 응답
 */
export interface CertificateList {
  items: Certificate[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// ==================== Study Plan Types ====================

/**
 * 학습 계획 마일스톤
 */
export interface Milestone {
  week: number
  title: string
  description: string
  hours: number
  completed: boolean
}

/**
 * 학습 주제
 */
export interface Topic {
  id: string
  title: string
  description?: string
  completed: boolean
}

/**
 * 학습 계획 (백엔드 API 스키마와 일치)
 */
export interface StudyPlan {
  id: string
  user_id: string
  certificate_id: string
  title: string               // 학습 계획 제목
  target_date: string         // ISO 날짜 (YYYY-MM-DD)
  daily_study_hours: number   // 하루 학습 시간 (0.5 ~ 12.0)
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress_percentage: number // 진행률 (0-100)
  total_weeks?: number | null // 총 학습 주차 수
  estimated_total_hours?: number | null // 총 예상 학습 시간
  topics: Topic[]             // 학습 주제 배열
  milestones: Milestone[]     // 마일스톤 배열
  created_at: string
  updated_at: string
  
  // Relations (populated by frontend)
  certificate?: Certificate
}

/**
 * 학습 계획 생성 요청
 */
export interface StudyPlanCreate {
  certificate_id: string
  title: string               // 학습 계획 제목
  target_date: string         // ISO 날짜 (YYYY-MM-DD)
  daily_study_hours: number   // 하루 학습 시간 (0.5 ~ 12.0)
  topics?: Topic[]            // 선택적 학습 주제
  milestones?: Milestone[]    // 선택적 마일스톤 (없으면 빈 배열)
}

/**
 * 학습 계획 수정 요청
 */
export interface StudyPlanUpdate {
  title?: string
  target_date?: string
  daily_study_hours?: number
  status?: 'active' | 'completed' | 'paused' | 'cancelled'
  progress_percentage?: number
  total_weeks?: number | null
  estimated_total_hours?: number | null
  topics?: Topic[]
  milestones?: Milestone[]
}

/**
 * 학습 계획 목록 응답
 */
export interface StudyPlanList {
  items: StudyPlan[]
  total: number
}

// ==================== Checkin Types ====================

export type MoodType = 'great' | 'good' | 'okay' | 'tired' | 'stressed'

export interface Checkin {
  id: string
  user_id: string
  study_plan_id: string
  checkin_date: string          // Changed from date
  hours_studied: number          // Changed from hours
  notes: string | null
  mood: MoodType | null
  created_at: string

  // Relations
  study_plan?: StudyPlan
}

export interface CheckinCreate {
  study_plan_id: string
  checkin_date?: string         // Optional, defaults to today
  hours_studied: number
  notes?: string
  mood?: MoodType
}

export interface CheckinList {
  items: Checkin[]
  total: number
}

export interface CheckinStats {
  total_hours: number
  total_days: number
  average_hours_per_day: number
  current_streak: number
  longest_streak: number
}

// ==================== Helper Types ====================

/**
 * 데이터 존재 여부 체크용 타입 가드
 */
export function hasExamInfo(cert: Certificate): cert is Certificate & { exam_info: ExamInfo } {
  return !!cert.exam_info && (cert.exam_info.subjects?.length ?? 0) > 0
}

// hasExamSchedule and hasEligibility removed - check official sources instead

export function hasCareerInfo(cert: Certificate): cert is Certificate & { career_info: CareerInfo } {
  return !!cert.career_info && (
    (cert.career_info.use_cases?.length ?? 0) > 0 ||
    (cert.career_info.related_jobs?.length ?? 0) > 0
  )
}

export function hasUserReviews(cert: Certificate): cert is Certificate & { user_reviews: UserReviews } {
  return !!cert.user_reviews && (
    !!cert.user_reviews.summary ||
    !!cert.user_reviews.difficulty_feedback ||
    (cert.user_reviews.study_tips?.length ?? 0) > 0
  )
}

export function hasOfficialSources(cert: Certificate): cert is Certificate & { official_sources: OfficialSources } {
  return !!cert.official_sources && (
    !!cert.official_sources.official_site ||
    !!cert.official_sources.issuing_organization
  )
}

export function hasStudyGuide(cert: Certificate): cert is Certificate & { study_guide: StudyGuide } {
  return !!cert.study_guide && (
    (cert.study_guide.study_methods?.length ?? 0) > 0 ||
    (cert.study_guide.learning_sequence?.length ?? 0) > 0 ||
    (cert.study_guide.success_tips?.length ?? 0) > 0 ||
    (cert.study_guide.recommended_books?.length ?? 0) > 0
  )
}

export function hasLectures(cert: Certificate): boolean {
  return !!cert.recommended_lectures && cert.recommended_lectures.length > 0
}

// ==================== Analytics Types ⭐ NEW ====================

/**
 * 학습자 상태 (Learner Status)
 */
export type LearnerStatus = 'exceeding' | 'on_track' | 'needs_attention' | 'at_risk'

/**
 * 복습 긴급도 (Review Urgency)
 */
export type ReviewUrgency = 'low' | 'medium' | 'high'

/**
 * 위험 신호 유형 (Risk Signal Type)
 */
export type RiskSignalType = 'streak_broken' | 'time_decreased' | 'mood_deteriorated' | 'milestone_delayed'

/**
 * 위험 신호 상세 정보
 */
export interface RiskSignal {
  type: RiskSignalType
  severity: 'low' | 'medium' | 'high'
  description: string
  detected_at: string
}

/**
 * 진행도 분석 (Progress Analytics)
 *
 * 복합 진행도 지표를 포함한 학습 분석 데이터
 */
export interface ProgressAnalytics {
  plan_id: string
  completion_rate: number               // 진도율 (0-100)
  time_adherence_rate: number           // 시간 이행률 (0-100+)
  schedule_adherence_rate: number       // 일정 준수율 (0-100+)
  current_streak: number                // 학습 연속성 (일)
  learning_pattern_score: number        // 학습 패턴 점수 (0-100)
  review_urgency: ReviewUrgency         // 복습 긴급도
  status: LearnerStatus                 // 학습자 상태
  predicted_completion_date: string | null  // 예상 완료일
  recommendations: string[]             // 추천 액션
  risk_signals: RiskSignal[]            // 이탈 위험 신호
}

/**
 * 학습 패턴 분석 (Learning Pattern)
 *
 * 학습자의 학습 습관 및 패턴 분석 결과
 */
export interface LearningPattern {
  plan_id: string
  preferred_time_slots: string[]        // 선호 학습 시간대 (오전/오후/저녁/새벽)
  average_session_duration: number      // 평균 세션 시간 (시간)
  best_weekday: string | null           // 최고 효율 요일
  worst_weekday: string | null          // 최저 효율 요일
  mood_trend: 'improving' | 'stable' | 'declining'  // 기분 추이
  recent_moods: string[]                // 최근 7일 기분 기록
  consistency_score: number             // 학습 일관성 점수 (0-100)
}
