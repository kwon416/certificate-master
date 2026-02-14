'use client'

import Link from 'next/link'
import { Layers, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SimilarCertificate } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useCertificate } from '@/hooks/use-certificates'

interface SimilarCertificatesTableProps {
  certificates: SimilarCertificate[]
  className?: string
}

/**
 * SimilarCertificateItem - 개별 유사 자격증 항목
 *
 * certificate_id가 있는 경우 DB 존재 여부를 확인하고 링크를 표시합니다.
 */
function SimilarCertificateItem({ cert }: { cert: SimilarCertificate }) {
  // certificate_id가 있는 경우에만 DB 조회
  const { data: existingCert, isLoading } = useCertificate(
    cert.certificate_id || '',
    {
      enabled: !!cert.certificate_id,
      retry: false, // 404일 경우 재시도하지 않음
    }
  )

  // DB에 존재하는 자격증인지 확인
  const hasValidLink = !!cert.certificate_id && !!existingCert

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-white mb-1">{cert.title}</h4>
        {cert.comparison && (
          <p className="text-sm text-slate-400">{cert.comparison}</p>
        )}
      </div>
      {cert.certificate_id && (
        isLoading ? (
          <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
        ) : hasValidLink ? (
          <Link href={`/certificates/${cert.slug || cert.certificate_id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300"
            >
              비교하기
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        ) : null
      )}
    </div>
  )
}

/**
 * SimilarCertificatesTable - 유사 자격증 비교 테이블
 *
 * 유사한 자격증들을 비교하여 보여줍니다.
 * 우리 DB에 존재하는 자격증만 링크를 표시합니다.
 */
export function SimilarCertificatesTable({
  certificates,
  className,
}: SimilarCertificatesTableProps) {
  if (!certificates || certificates.length === 0) return null

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-purple-400" />
          유사 자격증 비교
        </CardTitle>
        <CardDescription>
          비슷한 분야의 다른 자격증과 비교해 보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {certificates.map((cert, idx) => (
            <SimilarCertificateItem key={idx} cert={cert} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
