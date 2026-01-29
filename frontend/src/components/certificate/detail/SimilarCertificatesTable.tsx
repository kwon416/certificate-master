'use client'

import Link from 'next/link'
import { Layers, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SimilarCertificate } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface SimilarCertificatesTableProps {
  certificates: SimilarCertificate[]
  className?: string
}

/**
 * SimilarCertificatesTable - 유사 자격증 비교 테이블
 *
 * 유사한 자격증들을 비교하여 보여줍니다.
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
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">{cert.title}</h4>
                {cert.comparison && (
                  <p className="text-sm text-slate-400">{cert.comparison}</p>
                )}
              </div>
              {cert.certificate_id && (
                <Link href={`/certificates/${cert.certificate_id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    비교하기
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
