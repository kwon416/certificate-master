import { Metadata } from 'next'
import AboutContent from './about-content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '소개',
  description:
    '자격증 마스터는 600개 이상의 자격증 정보를 한눈에 비교할 수 있는 플랫폼입니다. 난이도, 준비 기간, 공식 일정을 확인하고 나에게 맞는 자격증을 찾아보세요.',
  keywords: [
    '자격증 마스터',
    '자격증 비교',
    '자격증 추천',
    '자격증 정보',
    '자격증 일정',
    '자격증 난이도',
  ],
  openGraph: {
    title: '소개 | 자격증 마스터',
    description:
      '600개 이상의 자격증 정보를 한눈에 비교하고, 나에게 맞는 자격증을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/about`,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '자격증 마스터 소개',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '소개 | 자격증 마스터',
    description:
      '600개 이상의 자격증 정보를 한눈에 비교하고, 나에게 맞는 자격증을 찾아보세요.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return <AboutContent />
}
