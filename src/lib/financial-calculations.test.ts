import { describe, expect, it } from 'vitest'
import {
  calculateCategoryTotals,
  calculateLineDiscount,
  calculateLineGross,
  calculateLineItem,
  calculateLineNet,
  calculateOverallDiscount,
  calculatePaid,
  calculatePaymentStatus,
  calculateWorkOrderFinancials,
  fromPersistedPaymentStatus,
  roundMoney,
  sumMoney,
  toPersistedPaymentStatus,
} from './financial-calculations'

describe('money precision', () => {
  it('rounds monetary values to cents', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(-1.005)).toBe(-1.01)
    expect(roundMoney(-0.001)).toBe(0)
    expect(roundMoney(Number.NaN)).toBe(0)
  })

  it('sums rounded monetary values in cents', () => {
    expect(sumMoney([0.1, 0.2, 1.005])).toBe(1.31)
  })
})

describe('line calculations', () => {
  it('calculates and rounds gross from quantity and unit price', () => {
    expect(calculateLineGross(3, 19.999)).toBe(60)
    expect(calculateLineGross(1, 1.005)).toBe(1.01)
  })

  it('normalizes invalid or negative gross inputs to zero', () => {
    expect(calculateLineGross(-2, 10)).toBe(0)
    expect(calculateLineGross(2, Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('calculates amount discounts and caps them at gross', () => {
    expect(calculateLineDiscount(100, 'amount', 12.345)).toBe(12.35)
    expect(calculateLineDiscount(100, 'amount', 150)).toBe(100)
  })

  it('calculates percentage discounts and caps percentages above 100', () => {
    expect(calculateLineDiscount(19.99, 'percent', 10)).toBe(2)
    expect(calculateLineDiscount(19.99, 'percent', 120)).toBe(19.99)
  })

  it('does not discount for a missing type or non-positive value', () => {
    expect(calculateLineDiscount(100, null, 20)).toBe(0)
    expect(calculateLineDiscount(100, 'percent', -20)).toBe(0)
  })

  it('calculates non-negative line net in cents', () => {
    expect(calculateLineNet(100, 12.35)).toBe(87.65)
    expect(calculateLineNet(100, 150)).toBe(0)
  })

  it('derives gross instead of trusting a stale persisted line_total', () => {
    const item = {
      category: 'parts',
      quantity: 2,
      unit_price: 10,
      line_total: 999,
      discount_type: 'amount' as const,
      discount_value: 3,
    }

    expect(calculateLineItem(item)).toEqual({
      category: 'parts',
      gross: 20,
      discount: 3,
      net: 17,
    })
  })
})

describe('work order calculations', () => {
  const lineItems = [
    {
      category: 'parts',
      quantity: 2,
      unit_price: 100,
      discount_type: 'amount' as const,
      discount_value: 10,
    },
    {
      category: 'parts',
      quantity: 1,
      unit_price: 50,
      discount_type: 'percent' as const,
      discount_value: 10,
    },
    {
      category: 'labor',
      quantity: 1.5,
      unit_price: 80,
      discount_type: null,
      discount_value: 0,
    },
  ]

  it('calculates category totals from line net values', () => {
    const lines = lineItems.map(calculateLineItem)

    expect(calculateCategoryTotals(lines)).toEqual([
      { category: 'parts', total: 235 },
      { category: 'labor', total: 120 },
    ])
  })

  it('calculates subtotal, overall percent discount, total, paid, and balance', () => {
    const result = calculateWorkOrderFinancials({
      lineItems,
      overallDiscountType: 'percent',
      overallDiscountValue: 10,
      paid: 150.01,
    })

    expect(result.grandSubtotal).toBe(355)
    expect(result.overallDiscount).toBe(35.5)
    expect(result.totalNet).toBe(319.5)
    expect(result.paid).toBe(150.01)
    expect(result.balance).toBe(169.49)
    expect(result.paymentStatus).toBe('partial')
  })

  it('caps an overall amount discount at the grand subtotal', () => {
    expect(calculateOverallDiscount(355, 'amount', 500)).toBe(355)

    const result = calculateWorkOrderFinancials({
      lineItems,
      overallDiscountType: 'amount',
      overallDiscountValue: 500,
    })

    expect(result.totalNet).toBe(0)
    expect(result.balance).toBe(0)
    expect(result.paymentStatus).toBe('unpaid')
  })

  it('retains zero-value categories and does not mutate inputs', () => {
    const input = Object.freeze([
      Object.freeze({
        category: 'parts',
        quantity: 1,
        unit_price: 25,
        discount_type: 'percent' as const,
        discount_value: 100,
      }),
    ])

    const result = calculateWorkOrderFinancials({ lineItems: input })

    expect(result.categoryTotals).toEqual([{ category: 'parts', total: 0 }])
    expect(input[0].unit_price).toBe(25)
  })

  it('returns an explicit empty-work-order result', () => {
    expect(calculateWorkOrderFinancials({})).toEqual({
      lines: [],
      categoryTotals: [],
      grandSubtotal: 0,
      overallDiscount: 0,
      totalNet: 0,
      paid: 0,
      balance: 0,
      paymentStatus: 'unpaid',
    })
  })

  it('reports a payment against a zero total as overpaid with no balance due', () => {
    const result = calculateWorkOrderFinancials({ paid: 10 })

    expect(result.totalNet).toBe(0)
    expect(result.paid).toBe(10)
    expect(result.balance).toBe(0)
    expect(result.paymentStatus).toBe('overpaid')
  })
})

describe('payments and status', () => {
  it('sums each payment in cents and ignores invalid negative amounts', () => {
    expect(
      calculatePaid([{ amount: 100.005 }, { amount: 50 }, { amount: -5 }, { amount: Number.NaN }]),
    ).toBe(150.01)
  })

  it.each([
    { total: 100, paid: 0, expected: 'unpaid' },
    { total: 100, paid: 25, expected: 'partial' },
    { total: 100, paid: 100, expected: 'paid' },
    { total: 100, paid: 100.01, expected: 'overpaid' },
    { total: 0, paid: 0, expected: 'unpaid' },
    { total: 0, paid: 1, expected: 'overpaid' },
  ] as const)('returns $expected for total $total and paid $paid', ({ total, paid, expected }) => {
    expect(calculatePaymentStatus(total, paid)).toBe(expected)
  })

  it('maps canonical overpaid to the existing schema token in both directions', () => {
    expect(toPersistedPaymentStatus('overpaid')).toBe('overpaid')
    expect(fromPersistedPaymentStatus('overpaid')).toBe('overpaid')
    expect(toPersistedPaymentStatus('paid')).toBe('paid')
  })
})
