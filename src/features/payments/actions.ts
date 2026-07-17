import { createClient } from '@/lib/supabase/client'
import { calculateLineTotal } from '@/lib/utils'
import type { Payment, PaymentInsert, PaymentUpdate, PaymentStatus } from '@/lib/types'

export async function getPayments(workOrderId: string): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

async function recalculatePaymentStatus(workOrderId: string): Promise<void> {
  const supabase = createClient()

  const { data: payments, error: pErr } = await supabase
    .from('payments')
    .select('amount')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
  if (pErr) throw pErr

  const { data: lineItems, error: liErr } = await supabase
    .from('line_items')
    .select('quantity, unit_price, discount_type, discount_value, line_total')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
  if (liErr) throw liErr

  const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
  const totalDue = (lineItems || []).reduce((sum, li) => {
    if (li.line_total != null) return sum + li.line_total
    return sum + calculateLineTotal(li.quantity ?? 0, li.unit_price ?? 0)
  }, 0)

  const paymentStatus: PaymentStatus =
    totalPaid <= 0 ? 'unpaid'
    : totalPaid < totalDue ? 'partial'
    : totalPaid >= totalDue && totalPaid > 0 ? 'paid'
    : 'refund'

  const { error: uErr } = await supabase
    .from('work_orders')
    .update({ payment_status: paymentStatus })
    .eq('id', workOrderId)
  if (uErr) throw uErr
}

export async function createPayment(data: PaymentInsert): Promise<Payment> {
  const supabase = createClient()
  const { data: newPayment, error } = await supabase
    .from('payments')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  await recalculatePaymentStatus(data.work_order_id)
  return newPayment
}

export async function updatePayment(id: string, data: PaymentUpdate): Promise<Payment> {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('payments')
    .select('work_order_id')
    .eq('id', id)
    .single()
  const { data: updated, error } = await supabase
    .from('payments')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (existing) await recalculatePaymentStatus(existing.work_order_id)
  return updated
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('payments')
    .select('work_order_id')
    .eq('id', id)
    .single()
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  if (existing) await recalculatePaymentStatus(existing.work_order_id)
}
