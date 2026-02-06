/**
 * Recommendation Store (Zustand)
 *
 * 자격증 추천 위자드의 상태를 관리합니다.
 * - 4단계 통합 버전 (2026-01-29)
 * - 자연어 기반 추천 추가 (2026-02-05)
 */
import { create } from 'zustand'
import type {
  Certificate,
  StructuredUserContext,
  NaturalLanguageResponse,
  NaturalRecommendedCertificate,
} from '@/lib/api/types'

// 입력 모드 타입
export type InputMode = 'wizard' | 'natural'

// Wizard 답변 타입
export interface WizardAnswers {
  situation_goal: string | null       // Step 1: 상황+목표 통합 (NEW)
  interest_domains: string | null     // Step 2: 관심 분야
  study_commitment: string | null     // Step 3: 투자 시간
  user_summary: string | null         // Step 4: 추가 정보 (선택)
  // 하위 호환성을 위해 유지 (API 호출 시 매핑)
  purpose: string | null
  current_status: string | null
  study_timeline: string | null
  difficulty_preference: string | null
  // 향상된 검색 필드 (선택)
  target_jobs: string[] | null           // 목표 직종 키워드
  target_industries: string[] | null     // 산업 분야 키워드
  certificate_level: string | null       // 자격증 등급 선호
  specific_keywords: string[] | null     // 특정 키워드
}

export interface WizardOption {
  value: string
  label: string
  icon?: string
  description?: string  // 부가 설명
  matchingTypes?: string[]
}

export type WizardStepType = 'options' | 'slider' | 'input' | 'combo' | 'enhanced-input' | 'input-with-natural'

export interface WizardStepConfig {
  step: number
  key: keyof WizardAnswers
  title: string
  description: string
  type?: WizardStepType
  options?: (string | WizardOption)[]
  secondaryKey?: keyof WizardAnswers
  secondaryOptions?: (string | WizardOption)[]
  tertiaryKey?: keyof WizardAnswers
  tertiaryOptions?: (string | WizardOption)[]
  min?: number
  max?: number
  sliderStep?: number
  placeholder?: string
  optional?: boolean
}

// 추천 결과 타입
export interface RecommendedCertificate {
  certificate: Certificate
  match_score: number
  recommendation_reason: string
  key_points: string[]
  feasibility: {
    can_prepare: boolean
    estimated_days: number
  }
}

export interface RecommendationResponse {
  recommendations: RecommendedCertificate[]
  query_summary: string
  user_summary?: string | null
  total_matched: number
}

interface RecommendState {
  // 입력 모드
  inputMode: InputMode

  // 위자드 상태
  currentStep: number
  answers: WizardAnswers
  recommendations: RecommendedCertificate[] | null
  querySummary: string | null
  totalMatched: number
  isLoading: boolean
  error: string | null

  // 자연어 추천 상태 (NEW)
  naturalInput: string
  structuredContext: StructuredUserContext | null
  naturalRecommendations: NaturalRecommendedCertificate[] | null
  queryUsed: string | null
  followUpQuestion: string | null

  // Step 4 자연어 통합 상태 (NEW)
  naturalInputInWizard: string    // Step 4 자연어 입력
  useNaturalMode: boolean         // 자연어 모드 토글

  // 액션
  setInputMode: (mode: InputMode) => void
  setAnswer: (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  resetWizard: () => void
  setRecommendations: (response: RecommendationResponse) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearRecommendations: () => void

  // 자연어 액션 (NEW)
  setNaturalInput: (input: string) => void
  setNaturalRecommendations: (response: NaturalLanguageResponse) => void
  clearNaturalRecommendations: () => void

  // Step 4 자연어 통합 액션 (NEW)
  setNaturalInputInWizard: (input: string) => void
  setUseNaturalMode: (use: boolean) => void
}

const defaultAnswers: WizardAnswers = {
  situation_goal: null,
  interest_domains: null,
  study_commitment: null,
  user_summary: null,
  // 하위 호환성 필드 (API 호출 시 매핑됨)
  purpose: null,
  current_status: null,
  study_timeline: null,
  difficulty_preference: null,
  // 향상된 검색 필드 (선택)
  target_jobs: null,
  target_industries: null,
  certificate_level: null,
  specific_keywords: null,
}

export const useRecommendStore = create<RecommendState>((set, get) => ({
  // 입력 모드
  inputMode: 'wizard',

  // 위자드 상태
  currentStep: 1,
  answers: { ...defaultAnswers },
  recommendations: null,
  querySummary: null,
  totalMatched: 0,
  isLoading: false,
  error: null,

  // 자연어 추천 상태 (NEW)
  naturalInput: '',
  structuredContext: null,
  naturalRecommendations: null,
  queryUsed: null,
  followUpQuestion: null,

  // Step 4 자연어 통합 상태 (NEW)
  naturalInputInWizard: '',
  useNaturalMode: false,

  // 입력 모드 전환
  setInputMode: (mode) => {
    set({ inputMode: mode })
  },

  setAnswer: (key, value) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    }))
  },

  nextStep: () => {
    const { currentStep } = get()
    if (currentStep < WIZARD_STEPS.length) {
      set({ currentStep: currentStep + 1 })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 })
    }
  },

  goToStep: (step) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      set({ currentStep: step })
    }
  },

  resetWizard: () => {
    set({
      inputMode: 'wizard',
      currentStep: 1,
      answers: { ...defaultAnswers },
      recommendations: null,
      querySummary: null,
      totalMatched: 0,
      error: null,
      // 자연어 상태도 초기화
      naturalInput: '',
      structuredContext: null,
      naturalRecommendations: null,
      queryUsed: null,
      followUpQuestion: null,
      // Step 4 자연어 통합 상태 초기화
      naturalInputInWizard: '',
      useNaturalMode: false,
    })
  },

  setRecommendations: (response) => {
    set({
      recommendations: response.recommendations,
      querySummary: response.query_summary,
      totalMatched: response.total_matched,
      isLoading: false,
      error: null,
    })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ error, isLoading: false })
  },

  clearRecommendations: () => {
    set({
      recommendations: null,
      querySummary: null,
      totalMatched: 0,
      // 자연어 결과도 초기화
      naturalRecommendations: null,
      structuredContext: null,
      queryUsed: null,
      followUpQuestion: null,
    })
  },

  // 자연어 입력 설정
  setNaturalInput: (input) => {
    set({ naturalInput: input })
  },

  // 자연어 추천 결과 설정
  setNaturalRecommendations: (response) => {
    set({
      structuredContext: response.structured_context,
      naturalRecommendations: response.recommendations,
      queryUsed: response.query_used,
      followUpQuestion: response.follow_up_question,
      totalMatched: response.total_matched,
      isLoading: false,
      error: null,
    })
  },

  // 자연어 추천 결과 초기화
  clearNaturalRecommendations: () => {
    set({
      naturalRecommendations: null,
      structuredContext: null,
      queryUsed: null,
      followUpQuestion: null,
    })
  },

  // Step 4 자연어 통합 액션 (NEW)
  setNaturalInputInWizard: (input) => {
    set({ naturalInputInWizard: input })
  },

  setUseNaturalMode: (use) => {
    set({ useNaturalMode: use })
  },
}))

// Validation helper: 필수 답변 완료 확인
export function areAllAnswersComplete(answers: WizardAnswers): boolean {
  return (
    answers.situation_goal !== null &&
    answers.interest_domains !== null &&
    answers.study_commitment !== null
  )
}

// 통합 필드 → API 필드 매핑
export function mapSituationGoalToFields(situationGoal: string): {
  purpose: string
  current_status: string
} {
  const mapping: Record<string, { purpose: string; current_status: string }> = {
    'student_employment': { purpose: '취업', current_status: 'student' },
    'jobseeker_employment': { purpose: '취업', current_status: 'entry_jobseeker' },
    'junior_career': { purpose: '이직', current_status: 'junior_worker' },
    'senior_expertise': { purpose: '커리어 전문성 강화', current_status: 'senior_worker' },
    'career_break_restart': { purpose: '취업', current_status: 'career_break' },
    'anyone_hobby': { purpose: '개인 관심 / 교양', current_status: 'entry_jobseeker' },
  }

  return mapping[situationGoal] || { purpose: '취업', current_status: 'student' }
}

// 전체 필드 매핑 (API 호출용)
export function mapAnswersToApiRequest(answers: WizardAnswers): {
  purpose: string
  current_status: string
  study_timeline: string
  difficulty_preference: string
  study_commitment: string
} {
  // 1. situation_goal → purpose + current_status
  const { purpose, current_status } = mapSituationGoalToFields(answers.situation_goal || '')

  // 2. current_status → study_timeline
  const statusToTimeline: Record<string, string> = {
    student: '6개월 이하',
    entry_jobseeker: '3개월 이하',
    junior_worker: '6개월 이하',
    senior_worker: '1년 이하',
    career_break: '6개월 이하',
  }

  // 3. study_commitment → difficulty_preference
  const commitmentToDifficulty: Record<string, string> = {
    relaxed: '쉬운 편',
    moderate: '중간',
    intensive: '어려워도 상관없음',
    unsure: '어려워도 상관없음',
  }

  const commitment = answers.study_commitment || 'moderate'

  const timeline = commitment === 'unsure'
    ? '상관없음'
    : statusToTimeline[current_status] || '6개월 이하'

  const difficulty = commitmentToDifficulty[commitment] || '중간'

  return {
    purpose,
    current_status,
    study_timeline: timeline,
    difficulty_preference: difficulty,
    study_commitment: commitment,
  }
}

// Step 1: 상황+목표 통합 옵션
export const WIZARD_OPTIONS = {
  situation_goal: [
    {
      value: 'student_employment',
      label: '학생 · 취준생',
      icon: '🎓',
      description: '취업 준비 중이에요',
    },
    {
      value: 'jobseeker_employment',
      label: '신입 구직자',
      icon: '🔍',
      description: '첫 직장을 찾고 있어요',
    },
    {
      value: 'junior_career',
      label: '주니어 현직자',
      icon: '💼',
      description: '이직 · 연봉 협상 준비',
    },
    {
      value: 'senior_expertise',
      label: '시니어 현직자',
      icon: '📈',
      description: '전문성 강화 · 커리어 전환',
    },
    {
      value: 'career_break_restart',
      label: '휴직 · 전업준비',
      icon: '🔄',
      description: '재취업 · 새로운 시작',
    },
    {
      value: 'anyone_hobby',
      label: '누구나',
      icon: '✨',
      description: '관심 · 교양 · 자기계발',
    },
  ] as WizardOption[],

  interest_domains: [
    { value: '기획/전략', label: '기획/전략', icon: '🎯' },
    { value: '마케팅/홍보/조사', label: '마케팅/홍보/조사', icon: '📣' },
    { value: '회계/세무/재무', label: '회계/세무/재무', icon: '💰' },
    { value: '인사/노무/HRD', label: '인사/노무/HRD', icon: '👥' },
    { value: '총무/법무/사무', label: '총무/법무/사무', icon: '⚖️' },
    { value: 'IT개발', label: 'IT개발', icon: '💻' },
    { value: '데이터', label: '데이터', icon: '📊' },
    { value: '디자인', label: '디자인', icon: '🎨' },
    { value: '영업/판매/무역', label: '영업/판매/무역', icon: '🤝' },
    { value: '고객상담/TM', label: '고객상담/TM', icon: '📞' },
    { value: '구매/자재/물류', label: '구매/자재/물류', icon: '📦' },
    { value: '상품기획/MD', label: '상품기획/MD', icon: '🛍️' },
    { value: '운전/운송/배송', label: '운전/운송/배송', icon: '🚛' },
    { value: '서비스', label: '서비스', icon: '🙋' },
    { value: '생산', label: '생산', icon: '🏭' },
    { value: '건설/건축', label: '건설/건축', icon: '🏗️' },
    { value: '의료', label: '의료', icon: '🏥' },
    { value: '연구/R&D', label: '연구/R&D', icon: '🔬' },
    { value: '교육', label: '교육', icon: '📚' },
    { value: '미디어/문화/스포츠', label: '미디어/문화/스포츠', icon: '🎬' },
    { value: '금융/보험', label: '금융/보험', icon: '🏦' },
    { value: '공공/복지', label: '공공/복지', icon: '🏛️' },
  ] as WizardOption[],

  study_commitment: [
    {
      value: 'relaxed',
      label: '여유 있게',
      icon: '🧘',
      description: '일상과 병행하며 천천히',
    },
    {
      value: 'moderate',
      label: '적당히',
      icon: '⚖️',
      description: '주 10시간 정도 투자 가능',
    },
    {
      value: 'intensive',
      label: '집중해서',
      icon: '🔥',
      description: '전업으로 빠르게 취득 목표',
    },
    {
      value: 'unsure',
      label: '잘 모르겠어요',
      icon: '🤷',
      description: '추천받고 결정할게요',
    },
  ] as WizardOption[],

  // 기존 필드 (하위 호환성)
  study_timeline: ['3개월 이하', '6개월 이하', '1년 이하', '1년 이상', '상관없음'],
  difficulty_preference: ['쉬운 편', '중간', '어려워도 상관없음'],

  // 자격증 등급 선호 (향상된 검색)
  certificate_level: [
    {
      value: '기능장',
      label: '기능장',
      icon: '🏆',
      description: '최고급 기술자격 (전문가 수준)',
    },
    {
      value: '기사',
      label: '기사',
      icon: '📜',
      description: '전문 기술자격 (대졸 수준)',
    },
    {
      value: '산업기사',
      label: '산업기사',
      icon: '📋',
      description: '중급 기술자격 (전문대졸 수준)',
    },
    {
      value: '기능사',
      label: '기능사',
      icon: '📝',
      description: '기초 기술자격 (입문 수준)',
    },
    {
      value: '상관없음',
      label: '상관없음',
      icon: '✨',
      description: '등급 상관없이 추천받기',
    },
  ] as WizardOption[],
}

// 4단계 Wizard 설정
export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    step: 1,
    key: 'situation_goal' as keyof WizardAnswers,
    title: '지금 상황과 목표를 알려주세요',
    description: '가장 가까운 항목을 선택해 주세요.',
    options: WIZARD_OPTIONS.situation_goal,
  },
  {
    step: 2,
    key: 'interest_domains' as keyof WizardAnswers,
    title: '어떤 분야에 관심이 있나요?',
    description: '관심 있는 분야를 하나 선택하세요.',
    options: WIZARD_OPTIONS.interest_domains,
  },
  {
    step: 3,
    key: 'study_commitment' as keyof WizardAnswers,
    title: '어느 정도 시간을 투자할 수 있나요?',
    description: '완벽하지 않아도 괜찮아요. 대략적인 계획만 알려주세요.',
    options: WIZARD_OPTIONS.study_commitment,
  },
  {
    step: 4,
    key: 'user_summary' as keyof WizardAnswers,
    title: '추가로 알려주실 게 있나요?',
    description: '간단히 입력하거나, 자세한 상황을 설명해주세요.',
    optional: true,
    type: 'input-with-natural',
    placeholder: '예) 데이터 분석 직무로 이직하고 싶어요',
  },
]
