import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cert.i-ve.ai'

export const metadata: Metadata = {
  title: '이용약관',
  description: '자격증 마스터 서비스 이용약관입니다. 서비스 이용 전 반드시 읽어주세요.',
  openGraph: {
    title: '이용약관 | 자격증 마스터',
    description: '자격증 마스터 서비스 이용약관입니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '자격증 마스터',
    url: `${SITE_URL}/terms`,
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">이용약관</h1>
      <p className="text-sm text-muted-foreground mb-8">
        최종 수정일: 2026년 2월 19일
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
        <p className="text-muted-foreground leading-relaxed">
          이 약관은 자격증 마스터(이하 &quot;서비스&quot;)가 제공하는 자격증 정보 및 학습 계획 서비스의 이용과 관련하여
          서비스와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제2조 (서비스 내용)</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          서비스는 다음과 같은 기능을 제공합니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>국가자격증 정보 검색 및 비교</li>
          <li>AI 기반 자격증 추천</li>
          <li>맞춤형 학습 계획 생성 및 관리</li>
          <li>학습 진행도 추적 및 체크인</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제3조 (이용자 의무)</h2>
        <p className="text-muted-foreground leading-relaxed">
          이용자는 서비스를 이용함에 있어 다음 행위를 해서는 안 됩니다:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
          <li>타인의 정보 도용 또는 허위 정보 제공</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>서비스에서 얻은 정보를 무단으로 상업적으로 이용하는 행위</li>
          <li>기타 관련 법령을 위반하는 행위</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제4조 (서비스 변경 및 중단)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
          서비스 변경 또는 중단 시 사전 공지를 원칙으로 하나, 불가피한 경우 사후 공지할 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제5조 (면책 조항)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스에서 제공하는 자격증 정보는 공공데이터(한국산업인력공단 큐넷)를 기반으로 하며,
          시험 일정, 합격률 등의 정보는 변경될 수 있습니다. 중요한 사항은 반드시 공식 기관에서 확인하시기 바랍니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">제6조 (문의)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스 이용 관련 문의사항은 아래 이메일로 연락해 주세요.
        </p>
        <p className="mt-2 text-foreground font-medium">이메일: contact@i-ve.ai</p>
      </section>
    </div>
  )
}
