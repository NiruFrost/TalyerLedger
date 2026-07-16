import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  const symbols: Record<string, string> = { PHP: '₱', USD: '$', EUR: '€' }
  const symbol = symbols[currency] || currency
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: string | Date, fmt: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function generateEstimateNumber(currentCount: number): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yy}-${mm}${dd}-${String(currentCount + 1).padStart(5, '0')}`
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function calculateJobTotal(lineItems: { line_total: number }[]): number {
  return lineItems.reduce((sum, item) => sum + item.line_total, 0)
}

export function calculateCategoryTotals(lineItems: { category: string; line_total: number }[]) {
  return lineItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.line_total
    return acc
  }, {})
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}...` : str
}

export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
}
