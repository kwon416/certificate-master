import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
