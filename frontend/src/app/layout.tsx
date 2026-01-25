import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Header, Footer } from '@/components/layout'
import { Providers } from '@/lib/providers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '자격증 추천 및 비교 | Certificate Master - 3분만에 내게 맞는 자격증 찾기',
  description: '3,500+ 자격증 정보를 난이도, 시험 정보, 준비 기간으로 비교하세요. 베타 버전에서는 자격증 검색과 정보 비교에 집중하고 있습니다.',
  keywords: [
    '자격증 추천',
    '자격증 정보',
    '자격증 비교',
    '시험 정보',
    '자격증 난이도',
    '자격증 준비 기간',
    '직장인 자격증',
    'IT 자격증',
    '3개월 자격증',
    '자격증 합격률',
  ],
  authors: [{ name: 'Certificate Master' }],
  openGraph: {
    title: '자격증 추천 및 비교 | Certificate Master',
    description: '3분만에 내게 맞는 자격증 찾기. 3,500+ 자격증 정보, 난이도, 시험 정보 한눈에 비교',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Certificate Master',
  },
  robots: {
    index: true,
    follow: true,
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
