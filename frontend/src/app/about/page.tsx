import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Brain, BarChart3, BookOpen } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '자격증 마스터 소개',
  description: '자격증 마스터는 600개 이상의 국가자격증 정보를 제공하고, AI가 나에게 맞는 자격증을 추천해주는 학습 플랫폼입니다.',
  keywords: [
    '자격증 마스터',
    '자격증 플랫폼',
    'AI 자격증 추천',
    '자격증 학습 계획',
    '국가자격증 정보',
  ],
  openGraph: {
    title: '자격증 마스터 소개 | 자격증 검색 및 AI 추천 플랫폼',
    description: '600개 이상의 국가자격증 정보와 AI 맞춤 추천, 학습 계획 자동 생성을 제공하는 자격증 마스터를 소개합니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: '자격증 마스터' }],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const features = [
  {
    icon: Search,
    title: '600+ 자격증 검색',
    description: '한국산업인력공단 큐넷 공공데이터 기반, 국가기술자격부터 전문자격까지 600개 이상의 자격증 정보를 한눈에 비교하세요.',
  },
  {
    icon: Brain,
    title: 'AI 맞춤 추천',
    description: '분야, 목표, 경험 수준, 학습 가능 시간을 입력하면 AI가 나에게 딱 맞는 자격증을 추천해 드립니다.',
  },
  {
    icon: BookOpen,
    title: '학습 계획 자동 생성',
    description: '목표 날짜와 하루 학습 시간을 설정하면, AI가 주차별 학습 마일스톤을 자동으로 생성합니다.',
  },
  {
    icon: BarChart3,
    title: '진행도 추적',
    description: '매일 체크인으로 학습 기록을 남기고, 목표 달성까지 남은 일수와 진행률을 시각적으로 확인하세요.',
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">자격증 마스터</span>란?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          자격증 준비생들이 산재된 정보를 일일이 찾는 불편함을 해소하기 위해 만들었습니다.
          자격증 검색, AI 추천, 학습 계획, 진행도 추적을 한 곳에서 제공합니다.
        </p>
      </div>

      {/* 핵심 기능 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">핵심 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 데이터 출처 */}
      <section className="mb-16 p-6 rounded-xl border border-border bg-muted/30">
        <h2 className="text-xl font-bold mb-4">데이터 출처</h2>
        <p className="text-muted-foreground leading-relaxed">
          자격증 마스터의 자격증 정보는{' '}
          <a
            href="https://www.q-net.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            한국산업인력공단 큐넷(Q-Net)
          </a>
          의 공공데이터를 기반으로 합니다.
          시험 일정, 합격률 등 세부 정보는 변경될 수 있으니 중요한 사항은 반드시 큐넷 공식 사이트에서 확인해 주세요.
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          자격증 검색 시작하기
        </Link>
      </div>
    </div>
  )
}
