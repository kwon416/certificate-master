import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Providers } from '@/lib/providers'
import { JsonLd } from '@/components/seo/json-ld'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '자격증 마스터 - 600+ 자격증 검색 및 비교',
    template: '%s | 자격증 마스터',
  },
  description: '자격증마스터에서 600개 이상의 국가자격증 정보를 한눈에! 정보처리기사, 전기기사, SQLD, 컴활 등 2026 인기 자격증의 난이도, 합격률, 시험일정을 비교하고 취업·이직에 필요한 나만의 자격증을 찾아보세요.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/apple-icon.png' },
    ],
  },
  manifest: '/manifest.json',
  keywords: [
    // 브랜드 키워드 (띄어쓰기/붙여쓰기 변형)
    '자격증 마스터',
    '자격증마스터',
    // 핵심 검색 키워드
    '자격증',
    '자격증 검색',
    '자격증 추천',
    '자격증 정보',
    '자격증 비교',
    '자격증 시험일정',
    '자격증 합격률',
    '자격증 난이도',
    '자격증 준비',
    '자격증 공부',
    '자격증 시험',
    '국가자격증',
    '국가기술자격',
    // 타겟 검색 키워드 (SNS/트렌드)
    '2026자격증',
    '자격증추천',
    '자격증TOP10',
    '취업자격증',
    '이직자격증',
    '자격증트렌드',
    '기사자격증',
    '자격증시험',
    '컴활자격증',
    '전기자격증',
    '자격증조회',
    // 인기 자격증
    '정보처리기사',
    '전기기사',
    'SQLD',
    '공인중개사',
    '한국산업인력공단',
    'IT 자격증',
    '직장인 자격증',
    '취업 자격증',
    '이직 자격증',
  ],
  authors: [{ name: '자격증 마스터' }],
  creator: '자격증 마스터',
  publisher: '자격증 마스터',
  openGraph: {
    title: '자격증 마스터 - 600+ 자격증 검색 및 비교',
    description: '600개 이상의 자격증 정보를 한눈에! 난이도, 합격률, 시험일정까지 비교하고 나에게 맞는 자격증을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '자격증 마스터 - 자격증 검색 및 비교 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '자격증 마스터 - 600+ 자격증 검색 및 비교',
    description: '600개 이상의 자격증 정보를 한눈에! 나에게 맞는 자격증을 찾아보세요.',
    images: [`${SITE_URL}/og-image.png`],
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
  other: {
    'theme-color': '#030712',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="dark">
      {/* Google Tag Manager - Head */}
      {GTM_ID && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}
      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Pretendard Variable Font - 단일 파일로 최적화 */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/woff2/PretendardVariable.woff2"
          crossOrigin="anonymous"
        />
        <style>{`
          @font-face {
            font-family: 'Pretendard Variable';
            font-weight: 45 920;
            font-style: normal;
            font-display: swap;
            src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations');
          }
        `}</style>
      </head>
      <body className={`${outfit.variable} font-sans`}>
        {/* Google Tag Manager - Body (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
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
