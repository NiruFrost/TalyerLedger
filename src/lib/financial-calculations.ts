import type { DiscountType, PaymentStatus } from './types'

export type CalculatedPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid'

export interface FinancialLineItemInput<Category extends string = string> {
  category: Category
  quantity?: number | null
  unit_price?: number | null
  discount_type?: DiscountType | '' | null
  discount_value?: number | null
}

export interface LineFinancials<Category extends string = string> {
  category: Category
  gross: number
  discount: number
  net: number
}

export interface CategoryFinancials<Category extends string = string> {
  category: Category
  total: number
}

export interface WorkOrderFinancialInput<Category extends string = string> {
  lineItems?: readonly FinancialLineItemInput<Category>[] | null
  overallDiscountType?: DiscountType | '' | null
  overallDiscountValue?: number | null
  paid?: number | null
}

export interface WorkOrderFinancials<Category extends string = string> {
  lines: LineFinancials<Category>[]
  categoryTotals: CategoryFinancials<Category>[]
  grandSubtotal: number
  overallDiscount: number
  totalNet: number
  paid: number
  balance: number
  paymentStatus: CalculatedPaymentStatus
}

export interface PaymentAmountInput {
  amount?: number | null
}

const CENTS_PER_UNIT = 100

function finiteNonNegative(value: number | null | undefined): number {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
}

function toCents(value: number): number {
  const sign = value < 0 ? -1 : 1
  return sign * Math.round((Math.abs(value) + Number.EPSILON) * CENTS_PER_UNIT)
}

function fromCents(cents: number): number {
  return cents === 0 ? 0 : cents / CENTS_PER_UNIT
}

export function roundMoney(value: number): number {
  return Number.isFinite(value) ? fromCents(toCents(value)) : 0
}

export function sumMoney(values: readonly number[]): number {
  return fromCents(
    values.reduce((total, value) => total + toCents(Number.isFinite(value) ? value : 0), 0),
  )
}

export function calculateLineGross(quantity: number, unitPrice: number): number {
  return roundMoney(finiteNonNegative(quantity) * finiteNonNegative(unitPrice))
}

function calculateDiscount(
  baseAmount: number,
  discountType: DiscountType | '' | null | undefined,
  discountValue: number | null | undefined,
): number {
  const base = roundMoney(finiteNonNegative(baseAmount))
  const value = finiteNonNegative(discountValue)

  if (base === 0 || value === 0) return 0

  const discount =
    discountType === 'amount'
      ? roundMoney(value)
      : discountType === 'percent'
        ? roundMoney((base * value) / 100)
        : 0

  return Math.min(base, discount)
}

export function calculateLineDiscount(
  gross: number,
  discountType: DiscountType | '' | null | undefined,
  discountValue: number | null | undefined,
): number {
  return calculateDiscount(gross, discountType, discountValue)
}

export function calculateLineNet(gross: number, discount: number): number {
  const grossCents = toCents(finiteNonNegative(gross))
  const discountCents = Math.min(grossCents, toCents(finiteNonNegative(discount)))
  return fromCents(grossCents - discountCents)
}

export function calculateLineItem<Category extends string>(
  item: FinancialLineItemInput<Category>,
): LineFinancials<Category> {
  const gross = calculateLineGross(item.quantity ?? 0, item.unit_price ?? 0)
  const discount = calculateLineDiscount(gross, item.discount_type, item.discount_value)

  return {
    category: item.category,
    gross,
    discount,
    net: calculateLineNet(gross, discount),
  }
}

export function calculateCategoryTotals<Category extends string>(
  lines: readonly LineFinancials<Category>[],
): CategoryFinancials<Category>[] {
  const totals = new Map<Category, number>()

  for (const line of lines) {
    totals.set(line.category, (totals.get(line.category) ?? 0) + toCents(line.net))
  }

  return Array.from(totals, ([category, total]) => ({ category, total: fromCents(total) }))
}

export function calculateOverallDiscount(
  grandSubtotal: number,
  discountType: DiscountType | '' | null | undefined,
  discountValue: number | null | undefined,
): number {
  return calculateDiscount(grandSubtotal, discountType, discountValue)
}

export function calculatePaid(payments: readonly PaymentAmountInput[]): number {
  return sumMoney(payments.map((payment) => finiteNonNegative(payment.amount)))
}

export function calculatePaymentStatus(totalNet: number, paid: number): CalculatedPaymentStatus {
  const totalCents = toCents(finiteNonNegative(totalNet))
  const paidCents = toCents(finiteNonNegative(paid))

  if (totalCents === 0) return paidCents === 0 ? 'unpaid' : 'overpaid'
  if (paidCents === 0) return 'unpaid'
  if (paidCents < totalCents) return 'partial'
  if (paidCents === totalCents) return 'paid'
  return 'overpaid'
}

export function toPersistedPaymentStatus(status: CalculatedPaymentStatus): PaymentStatus {
  return status
}

export function fromPersistedPaymentStatus(status: PaymentStatus): CalculatedPaymentStatus {
  return status
}

export function calculateWorkOrderFinancials<Category extends string = string>(
  input: WorkOrderFinancialInput<Category>,
): WorkOrderFinancials<Category> {
  const lines = (input.lineItems ?? []).map(calculateLineItem)
  const categoryTotals = calculateCategoryTotals(lines)
  const grandSubtotal = sumMoney(lines.map((line) => line.net))
  const overallDiscount = calculateOverallDiscount(
    grandSubtotal,
    input.overallDiscountType,
    input.overallDiscountValue,
  )
  const totalNet = calculateLineNet(grandSubtotal, overallDiscount)
  const paid = roundMoney(finiteNonNegative(input.paid))
  const balance = calculateLineNet(totalNet, paid)

  return {
    lines,
    categoryTotals,
    grandSubtotal,
    overallDiscount,
    totalNet,
    paid,
    balance,
    paymentStatus: calculatePaymentStatus(totalNet, paid),
  }
}
