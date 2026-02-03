import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Header, Footer } from '@/components/layout'
import { Providers } from '@/lib/providers'
import { JsonLd } from '@/components/seo'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '자격증 마스터 - 3,500+ 자격증 검색 및 비교',
    template: '%s | 자격증 마스터',
  },
  description: '3,500개 이상의 자격증 정보를 한눈에! 난이도, 합격률, 시험일정, 응시료까지 비교하고 나에게 맞는 자격증을 찾아보세요. 정보처리기사, 전기기사, 공인중개사 등 인기 자격증 정보 제공.',
  icons: {
    icon: [
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/web-app-manifest-192x192.png',
  },
  keywords: [
    '자격증',
    '자격증 검색',
    '자격증 추천',
    '자격증 정보',
    '자격증 비교',
    '자격증 시험일정',
    '자격증 합격률',
    '자격증 난이도',
    '국가자격증',
    '국가기술자격',
    '정보처리기사',
    '전기기사',
    '공인중개사',
    '한국산업인력공단',
    'IT 자격증',
    '직장인 자격증',
    '취업 자격증',
  ],
  authors: [{ name: '자격증 마스터' }],
  creator: '자격증 마스터',
  publisher: '자격증 마스터',
  openGraph: {
    title: '자격증 마스터 - 3,500+ 자격증 검색 및 비교',
    description: '3,500개 이상의 자격증 정보를 한눈에! 난이도, 합격률, 시험일정까지 비교하고 나에게 맞는 자격증을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: SITE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '자격증 마스터 - 자격증 검색 및 비교 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '자격증 마스터 - 3,500+ 자격증 검색 및 비교',
    description: '3,500개 이상의 자격증 정보를 한눈에! 나에게 맞는 자격증을 찾아보세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${outfit.variable} font-sans`}>
        <JsonLd type="WebSite" />
        <JsonLd type="Organization" />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
