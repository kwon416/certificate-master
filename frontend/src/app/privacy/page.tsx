import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '자격증 마스터의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보관 및 파기 정책을 안내합니다.',
  openGraph: {
    title: '개인정보처리방침 | 자격증 마스터',
    description: '자격증 마스터의 개인정보처리방침입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/privacy`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '자격증 마스터 개인정보처리방침' }],
  },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

const sections = [
  '수집하는 개인정보 항목',
  '개인정보 이용 목적',
  '보관 및 파기 정책',
  '제3자 제공 및 위탁',
  '이용자 권리',
]

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <Badge className="mb-4 bg-slate-800 text-slate-300 hover:bg-slate-700">
          준비 중
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          개인정보처리방침
        </h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          개인정보 보호 기준을 정리 중입니다. 공개 전까지 안전하게 준비하고 있어요.
        </p>
      </div>

      <div className="mt-12 grid gap-6">
        {sections.map((title) => (
          <Card key={title} className="border-slate-800/60 bg-slate-900/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
