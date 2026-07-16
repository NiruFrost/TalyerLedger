'use client'

import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { calculateCategoryTotals, formatCurrency } from '@/lib/utils'
import type { LineItem } from '@/lib/types'

interface CategoryTotalsProps {
  lineItems: LineItem[]
  currency?: string
}

export function CategoryTotals({ lineItems, currency = 'PHP' }: CategoryTotalsProps) {
  const categoryTotals = calculateCategoryTotals(lineItems)
  const grandTotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)

  return (
    <div className="space-y-2">
      {LINE_ITEM_CATEGORIES.map((cat) => {
        const total = categoryTotals[cat.value] ?? 0
        if (total === 0) return null
        return (
          <div key={cat.value} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{cat.label}</span>
            <span className="font-medium">{formatCurrency(total, currency)}</span>
          </div>
        )
      })}
      <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
        <span>Grand Total</span>
        <span>{formatCurrency(grandTotal, currency)}</span>
      </div>
    </div>
  )
}
