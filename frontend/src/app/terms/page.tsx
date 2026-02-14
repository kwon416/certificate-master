import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '이용약관',
  description: '자격증 마스터의 이용약관입니다. 서비스 이용, 회원 계정 및 책임, 면책 및 책임 제한에 대해 안내합니다.',
  openGraph: {
    title: '이용약관 | 자격증 마스터',
    description: '자격증 마스터의 이용약관입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/terms`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '자격증 마스터 이용약관' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '이용약관 | 자격증 마스터',
    description: '자격증 마스터의 이용약관입니다.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

const sections = [
  '서비스 이용',
  '회원 계정 및 책임',
  '결제 및 환불',
  '면책 및 책임 제한',
  '문의 안내',
]

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <Badge className="mb-4 bg-muted text-foreground/80 hover:bg-muted">
          준비 중
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          이용약관
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          서비스 운영 정책을 정리 중입니다. 빠른 시일 내에 업데이트하겠습니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6">
        {sections.map((title) => (
          <Card key={title} className="border-border bg-card/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
