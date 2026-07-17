import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentInsert, PaymentUpdate } from '@/lib/types'

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

export async function createPayment(data: PaymentInsert): Promise<Payment> {
  const supabase = createClient()
  const { data: newPayment, error } = await supabase
    .from('payments')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return newPayment
}

export async function updatePayment(id: string, data: PaymentUpdate): Promise<Payment> {
  const supabase = createClient()
  const { data: updated, error } = await supabase
    .from('payments')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
