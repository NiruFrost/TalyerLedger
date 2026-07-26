'use client'

import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { calculateWorkOrderFinancials } from '@/lib/financial-calculations'
import type { DiscountType, LineItem } from '@/lib/types'

interface CategoryTotalsProps {
  lineItems: LineItem[]
  currency?: string
  overallDiscountType?: DiscountType | null
  overallDiscountValue?: number
}

export function CategoryTotals({
  lineItems,
  currency = 'PHP',
  overallDiscountType,
  overallDiscountValue,
}: CategoryTotalsProps) {
  const calculations = calculateWorkOrderFinancials({
    lineItems,
    overallDiscountType,
    overallDiscountValue,
  })
  const categoryTotals = new Map(
    calculations.categoryTotals.map(({ category, total }) => [category, total])
  )

  return (
    <div className="space-y-2">
      {LINE_ITEM_CATEGORIES.map((cat) => {
        const total = categoryTotals.get(cat.value) ?? 0
        if (total === 0) return null
        return (
          <div key={cat.value} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{cat.label}</span>
            <span className="font-medium">{formatCurrency(total, currency)}</span>
          </div>
        )
      })}
      {calculations.overallDiscount > 0 && (
        <>
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span>Grand Subtotal</span>
            <span>{formatCurrency(calculations.grandSubtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Overall Discount</span>
            <span>-{formatCurrency(calculations.overallDiscount, currency)}</span>
          </div>
        </>
      )}
      <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
        <span>Total Net</span>
        <span>{formatCurrency(calculations.totalNet, currency)}</span>
      </div>
    </div>
  )
}
