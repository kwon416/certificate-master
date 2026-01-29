'use client'

import { DollarSign, Gift, Book, GraduationCap, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CostBreakdown } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface CostBreakdownCardProps {
  costBreakdown: CostBreakdown
  className?: string
}

interface CostItemProps {
  icon: React.ElementType
  label: string
  value: string | null
  colorClass: string
}

function CostItem({ icon: Icon, label, value, colorClass }: CostItemProps) {
  if (!value) return null

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-b-0">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', colorClass)} />
        <span className="text-slate-300">{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

/**
 * CostBreakdownCard - 비용 상세 breakdown 카드
 *
 * 응시료, 교재비, 인강비, 총 비용을 표시합니다.
 */
export function CostBreakdownCard({ costBreakdown, className }: CostBreakdownCardProps) {
  const hasAnyData =
    costBreakdown.exam_fee ||
    costBreakdown.textbook_cost ||
    costBreakdown.lecture_cost ||
    costBreakdown.total_estimated_cost ||
    (costBreakdown.free_resources?.length ?? 0) > 0

  if (!hasAnyData) return null

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-amber-400" />
          예상 비용
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <CostItem
            icon={DollarSign}
            label="응시료"
            value={costBreakdown.exam_fee}
            colorClass="text-amber-400"
          />
          <CostItem
            icon={Book}
            label="교재비"
            value={costBreakdown.textbook_cost}
            colorClass="text-purple-400"
          />
          <CostItem
            icon={GraduationCap}
            label="인강비"
            value={costBreakdown.lecture_cost}
            colorClass="text-cyan-400"
          />
        </div>

        {/* 총 비용 (강조 표시) */}
        {costBreakdown.total_estimated_cost && (
          <div className="mt-4 p-4 bg-amber-900/20 rounded-lg border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">총 예상 비용</span>
              <span className="text-2xl font-bold text-amber-400">
                {costBreakdown.total_estimated_cost}
              </span>
            </div>
            {costBreakdown.exam_fee_refund && (
              <p className="text-xs text-slate-500 mt-2">
                환불 정책: {costBreakdown.exam_fee_refund}
              </p>
            )}
          </div>
        )}

        {/* 무료 자료 */}
        {(costBreakdown.free_resources?.length ?? 0) > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">무료 학습 자료</span>
            </div>
            <ul className="space-y-1">
              {costBreakdown.free_resources.map((resource, idx) => (
                <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
