import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
        <Badge className="mb-4 bg-slate-800 text-slate-300 hover:bg-slate-700">
          준비 중
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          이용약관
        </h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          서비스 운영 정책을 정리 중입니다. 빠른 시일 내에 업데이트하겠습니다.
        </p>
      </div>

      <div className="mt-12 grid gap-6">
        {sections.map((title) => (
          <Card key={title} className="border-slate-800/60 bg-slate-900/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
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
