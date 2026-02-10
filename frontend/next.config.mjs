import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Barrel file import 최적화 (Vercel Best Practice: bundle-barrel-imports)
  // lucide-react 등의 barrel import를 빌드 타임에 직접 import로 변환하여
  // 번들 사이즈 절감 및 개발 서버 부팅 속도 향상
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
    ],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // /search → / 리다이렉트
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // API 프록시 설정 (Docker 환경용)
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
      {
        source: '/docs',
        destination: `${backendUrl}/docs`,
      },
      {
        source: '/openapi.json',
        destination: `${backendUrl}/openapi.json`,
      },
    ];
  },

  // 프로덕션 최적화
  swcMinify: true,
  compiler: {
    // React 프로덕션 최적화
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 번들 최적화
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // 트레일링 슬래시 제거 (SEO)
  trailingSlash: false,

  // 파워드 바이 헤더 제거
  poweredByHeader: false,
};

export default withBundleAnalyzer(nextConfig);
