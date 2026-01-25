export * from './database.types'

// UI specific types
export interface SearchResult {
  id: string
  title: string
  category: string
  difficulty: number | null
  passRate: number | null
  studyPeriod: number | null
  overview: string | null
  similarityScore?: number
}

export interface RecommendedLecture {
  rank: number
  title: string
  instructor: string
  platform: string
  price: number
  rating: number
  reviews: number
  url: string
}

export interface ExamInfo {
  nextExamDate: string | null
  registrationPeriod: string | null
  testFormat: string | null
  managingOrganization: string | null
}

export interface StudyPlanMilestone {
  week: string
  title: string
  tasks: string[]
  completed: boolean
}

export interface WeeklySchedule {
  week: string
  description: string
  hours: number
  tasks: string[]
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}

// Dashboard types
export interface DashboardStats {
  totalStudyHours: number
  streakDays: number
  completedTasks: number
  progressPercentage: number
}

export interface CheckinEntry {
  date: string
  durationMinutes: number
  notes?: string
  completedTasks?: string[]
}

