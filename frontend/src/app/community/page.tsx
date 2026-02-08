import { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Users, Sparkles, Megaphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '커뮤니티',
  description: '자격증 마스터 커뮤니티에서 합격 후기를 공유하고, 스터디를 모집하고, 최신 자격증 정보를 확인하세요.',
  openGraph: {
    title: '커뮤니티 | 자격증 마스터',
    description: '자격증 마스터 커뮤니티에서 합격 후기를 공유하고, 스터디를 모집하세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/community`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '자격증 마스터 커뮤니티' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | 자격증 마스터',
    description: '자격증 마스터 커뮤니티에서 합격 후기를 공유하고, 스터디를 모집하세요.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
}

const upcomingFeatures = [
  {
    title: '합격 후기 공유',
    description: '실제 합격 경험과 공부 팁을 나누는 공간을 준비하고 있어요.',
    icon: MessageSquare,
  },
  {
    title: '스터디 모집',
    description: '같이 공부할 사람을 찾고, 목표를 함께 관리할 수 있어요.',
    icon: Users,
  },
  {
    title: '공지 및 업데이트',
    description: '신규 기능, 데이터 업데이트 소식을 가장 먼저 알려드릴게요.',
    icon: Megaphone,
  },
]

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
          준비 중
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          커뮤니티
        </h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          자격증 준비 경험을 공유하고, 서로의 목표를 응원할 수 있는 공간을 만들고 있습니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {upcomingFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="border-slate-800/60 bg-slate-900/60">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
        <Button asChild className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold hover:from-emerald-400 hover:to-cyan-400">
          <Link href="/">
            <Sparkles className="mr-2 h-4 w-4" />
            자격증 찾아보기
          </Link>
        </Button>
      </div>
    </div>
  )
}
