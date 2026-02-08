import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '소개 - 자격증 마스터란?',
  description: '자격증 마스터는 600개 이상의 자격증 정보를 제공하고, AI 기반 맞춤 추천과 학습 플랜을 지원하는 플랫폼입니다.',
  openGraph: {
    title: '소개 - 자격증 마스터란? | 자격증 마스터',
    description: '자격증 마스터는 600개 이상의 자격증 정보를 제공하고, AI 기반 맞춤 추천과 학습 플랜을 지원하는 플랫폼입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: '자격증 마스터 소개' }],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
