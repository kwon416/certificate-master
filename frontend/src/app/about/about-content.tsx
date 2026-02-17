'use client'

import Link from 'next/link'
import {
  Search,
  BarChart3,
  Sparkles,
  Trophy,
  Target,
  Zap,
  AlertCircle,
  HelpCircle,
  Calendar,
  MessageSquare,
  Globe,
  FileText,
  FileSearch,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProblemCard from '@/components/landing/problem-card'
import LimitationCard from '@/components/landing/limitation-card'
import ValueCard from '@/components/landing/value-card'
import UsageStep from '@/components/landing/usage-step'
import { motion } from 'framer-motion'

const coreValues = [
  {
    icon: BarChart3,
    result: '자격증을 비교 가능한 기준으로 정리했습니다',
    how: '난이도, 준비 기간, 공식 일정 링크를 한눈에 확인',
    proof: '600+ 자격증, 통일된 기준으로 정리',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    icon: Target,
    result: '시험 정보뿐 아니라 준비 난이도와 활용도를 함께 제공합니다',
    how: '이 자격증이 나에게 맞는가 판단 가능',
    proof: '실제 수험 정보를 기반으로 제공',
    gradient: 'from-cyan-500 to-cyan-600'
  },
  {
    icon: Calendar,
    result: '일정과 준비 기간을 고려해 지금 시작할 수 있는지 알려드립니다',
    how: '목표 날짜 입력 시 준비 여유와 추천 시작 시점 안내',
    proof: '공식 출처 기반 일정 안내',
    gradient: 'from-violet-500 to-violet-600'
  }
]

const problems = [
  {
    icon: Search,
    text: '자격증이 너무 많아서 뭘 골라야 할지 모르겠어요',
    emotion: 'overwhelmed' as const,
  },
  {
    icon: AlertCircle,
    text: '검색할수록 정보가 제각각이라 더 헷갈려요',
    emotion: 'confused' as const,
  },
  {
    icon: HelpCircle,
    text: '이 자격증이 취업이나 이직에 도움이 될까요?',
    emotion: 'stressed' as const,
  },
  {
    icon: Calendar,
    text: '공식 일정 정보를 찾기 어려워요',
    emotion: 'demotivated' as const,
  },
]

const limitations = [
  {
    method: '블로그·카페 정보',
    icon: MessageSquare,
    issues: [
      '주관적이고 오래된 경우가 많아요',
      '사람마다 상황이 달라 혼란스러워요',
      '신뢰할 수 있는 정보인지 확인이 어려워요'
    ]
  },
  {
    method: '자격증 공식 사이트',
    icon: Globe,
    issues: [
      '정보는 많지만 비교 기준이 제각각이에요',
      '여러 사이트를 오가며 확인해야 해요',
      '내게 맞는 자격증인지 판단하기 어려워요'
    ]
  },
  {
    method: '직접 정리하기',
    icon: FileText,
    issues: [
      '생각보다 많은 시간이 필요해요',
      '어떤 기준으로 비교해야 할지 막막해요',
      '정보가 최신인지 확인하기 어려워요'
    ]
  }
]

const usageSteps = [
  {
    step: 1,
    title: '관심 분야 또는 상황을 선택하세요',
    description: 'IT, 금융, 공무원 등 분야나 \'직장인 준비\' 같은 상황을 선택하세요.',
    icon: Search,
  },
  {
    step: 2,
    title: '추천 자격증과 핵심 정보를 확인하세요',
    description: '난이도, 준비 기간, 공식 일정 링크, 활용도를 한눈에 비교하세요.',
    icon: FileSearch,
  },
  {
    step: 3,
    title: '준비 일정과 다음 행동을 결정하세요',
    description: '난이도와 일정 정보를 보고 바로 준비를 시작하세요.',
    icon: CheckCircle,
  }
]

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export default function AboutContent() {
  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-slide-up">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                자격증 비교 정보 플랫폼
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up stagger-1">
              <span className="text-foreground">
                나에게<br className="block md:hidden" /> 맞는{' '}
                <span className="gradient-text">자격증</span> 찾기
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-2">
              흩어진 자격증 정보를 한 화면에 모아
              <br className="hidden md:block" />
              시험 정보 · 공부 방법 · 후기 기준으로 정리했어요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-3">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-lg px-8 py-6 hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25"
              >
                <Link href="/">
                  <Search className="mr-2 h-5 w-5" />
                  자격증 한눈에 보기
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-slide-up stagger-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>맞춤형 AI 자격증 추천</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>공공데이터 기반 자격증 정보</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>시험 일정 · 난이도 비교</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Empathy Section */}
      <motion.section
        className="py-24 bg-card/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            혹시 이런 고민, 하고 계신가요?
          </h2>
          <motion.div className="grid md:grid-cols-2 gap-6 mb-8" variants={listVariants}>
            {problems.map((problem, index) => (
              <motion.div key={index} variants={itemVariants}>
                <ProblemCard {...problem} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Solution Limitations Section */}
      <motion.section
        className="py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            혹시 이런 방법으로 찾고 계셨나요?
          </h2>
          <motion.div className="grid md:grid-cols-3 gap-8 mb-8" variants={listVariants}>
            {limitations.map((limit, index) => (
              <motion.div key={index} variants={itemVariants}>
                <LimitationCard {...limit} />
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-muted-foreground text-lg font-medium">
            정보는 많지만 나한테 맞는지 알 수 없었죠.
            <br className="hidden md:block" />
            이제 저희가 그 고민을 해결해드려요.
          </p>
        </div>
      </motion.section>

      {/* Core Value Section */}
      <motion.section
        className="py-24 bg-card/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            Certificate Master는 다릅니다
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            결과로 증명하는 3가지 핵심 가치
          </p>
          <motion.div className="grid md:grid-cols-3 gap-8" variants={listVariants}>
            {coreValues.map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <ValueCard {...value} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Usage Flow Section */}
      <motion.section
        className="py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mx-auto mb-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 block w-fit">
            이용 방법
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            복잡한 선택을 단순하게
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            자격증 확인까지 1분이면 충분합니다.
          </p>

          {/* Desktop: Horizontal with connecting line */}
          <div className="relative">
            {/* Connecting Line (desktop only) */}
            <div
              data-testid="connecting-line"
              className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-30"
              style={{ width: 'calc(100% - 200px)', left: '100px' }}
            />

            <motion.div className="grid md:grid-cols-3 gap-12 relative z-10" variants={listVariants}>
              {usageSteps.map((step) => (
                <motion.div key={step.step} variants={itemVariants}>
                  <UsageStep {...step} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted border border-border">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative px-8 py-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                지금 확인하고 결정하세요
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                자격증 선택, 더 이상 혼자 고민하지 마세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-lg px-8 hover:from-emerald-400 hover:to-cyan-400"
                >
                  <Link href="/">
                    <Search className="mr-2 h-5 w-5" />
                    자격증 한눈에 보기
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
