/**
 * Recommendation Store (Zustand)
 *
 * 자격증 추천 위자드의 상태를 관리합니다.
 */
import { create } from 'zustand'
import type { Certificate } from '@/lib/api/types'

// Wizard 답변 타입
export interface WizardAnswers {
  purpose: string | null              // Step 1: 추천 목적/맥락
  interest_domains: string | null     // Step 2: 관심 분야(단일 선택)
  study_timeline: string | null       // Step 3: 예상 공부 기간
  difficulty_preference: string | null// Step 4: 난이도 선호
  user_summary: string | null         // Step 5: 최종 한 문장 요약 (선택)
}

export interface WizardOption {
  value: string
  label: string
  icon?: string
  matchingTypes?: string[]  // 매칭되는 자격증 유형
}

export type WizardStepType = 'options' | 'slider' | 'input' | 'combo'

export interface WizardStepConfig {
  step: number
  key: keyof WizardAnswers
  title: string
  description: string
  type?: WizardStepType
  options?: (string | WizardOption)[]
  secondaryKey?: keyof WizardAnswers
  secondaryOptions?: (string | WizardOption)[]
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
  total_matched: number
}

interface RecommendState {
  // Wizard 상태
  currentStep: number
  answers: WizardAnswers

  // 추천 결과
  recommendations: RecommendedCertificate[] | null
  querySummary: string | null
  totalMatched: number
  isLoading: boolean
  error: string | null

  // Wizard Actions
  setAnswer: (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  resetWizard: () => void

  // Recommendation Actions
  setRecommendations: (response: RecommendationResponse) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearRecommendations: () => void
}

const defaultAnswers: WizardAnswers = {
  purpose: null,
  interest_domains: null,
  study_timeline: null,
  difficulty_preference: null,
  user_summary: null,
}

export const useRecommendStore = create<RecommendState>((set, get) => ({
  // Initial state
  currentStep: 1,
  answers: { ...defaultAnswers },
  recommendations: null,
  querySummary: null,
  totalMatched: 0,
  isLoading: false,
  error: null,

  // Wizard Actions
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
      currentStep: 1,
      answers: { ...defaultAnswers },
      recommendations: null,
      querySummary: null,
      totalMatched: 0,
      error: null,
    })
  },

  // Recommendation Actions
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
    })
  },
}))

// Validation helper: 모든 답변이 완료되었는지 확인
export function areAllAnswersComplete(answers: WizardAnswers): boolean {
  return (
    answers.purpose !== null &&
    answers.interest_domains !== null &&
    answers.study_timeline !== null &&
    answers.difficulty_preference !== null
  )
}

// Options for each step (Updated 2026-01-25)
export const WIZARD_OPTIONS = {
  purpose: [
    {
      value: '취업',
      label: '취업 준비',
      icon: '🎯',
      matchingTypes: ['국가기술자격', '과정평가형자격'],
    },
    {
      value: '이직',
      label: '이직 · 연봉 상승',
      icon: '📈',
      matchingTypes: ['국가기술자격(기사·산업기사)', '국가전문자격'],
    },
    {
      value: '커리어 전문성 강화',
      label: '전문성 증명',
      icon: '🏆',
      matchingTypes: ['국가전문자격', '상위 국가기술자격'],
    },
    {
      value: '창업 / 실무 활용',
      label: '실무에 바로 활용',
      icon: '💼',
      matchingTypes: ['일학습병행자격', '과정평가형자격'],
    },
    {
      value: '개인 관심 / 교양',
      label: '관심 · 교양',
      icon: '✨',
      matchingTypes: ['난이도 낮은 국가기술자격', '일부 전문자격'],
    },
  ] as WizardOption[],
  interest_domains: [
    '기획/전략',
    '마케팅/홍보/조사',
    '회계/세무/재무',
    '인사/노무/HRD',
    '총무/법무/사무',
    'IT개발',
    '데이터',
    '디자인',
    '영업/판매/무역',
    '고객상담/TM',
    '구매/자재/물류',
    '상품기획/MD',
    '운전/운송/배송',
    '서비스',
    '생산',
    '건설/건축',
    '의료',
    '연구/R&D',
    '교육',
    '미디어/문화/스포츠',
    '금융/보험',
    '공공/복지',
  ],
  study_timeline: [
    '3개월 이하',
    '6개월 이하',
    '1년 이하',
    '1년 이상',
    '상관없음',
  ],
  difficulty_preference: [
    '쉬운 편',
    '중간',
    '어려워도 상관없음',
  ],
}

// Step configurations (intent-first flow)
export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    step: 1,
    key: 'purpose' as keyof WizardAnswers,
    title: '자격증이 필요한 이유는 무엇인가요?',
    description: '지금 상황과 가장 가까운 항목을 선택해 주세요.',
    options: WIZARD_OPTIONS.purpose,
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
    key: 'study_timeline' as keyof WizardAnswers,
    title: '예상 공부 기간은?',
    description: '현실적인 준비 기간을 선택하세요.',
    options: WIZARD_OPTIONS.study_timeline,
  },
  {
    step: 4,
    key: 'difficulty_preference' as keyof WizardAnswers,
    title: '난이도 선호는 어떤가요?',
    description: '선호하는 난이도를 선택하세요.',
    options: WIZARD_OPTIONS.difficulty_preference,
  },
  {
    step: 5,
    key: 'user_summary' as keyof WizardAnswers,
    title: '추가 정보 입력',
    description: '선택하지 않아도 됩니다.',
    optional: true,
    type: 'input',
    placeholder: '예) 데이터 분석 직무로 이직하려고 6개월 안에 준비할 수 있는 자격증을 찾고 있어요.',
  },
]
