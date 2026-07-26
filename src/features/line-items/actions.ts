import { createClient } from '@/lib/supabase/client'
import { softDeleteRecord } from '@/lib/database/soft-delete'
import { calculateLineGross } from '@/lib/financial-calculations'
import type { LineItem, LineItemInsert, LineItemUpdate } from '@/lib/types'

export async function getLineItemsByWorkOrder(workOrderId: string): Promise<LineItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('line_items')
    .select('*')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createLineItem(data: LineItemInsert): Promise<LineItem> {
  const supabase = createClient()
  const lineTotal = calculateLineGross(data.quantity ?? 0, data.unit_price ?? 0)

  const { data: newItem, error } = await supabase
    .from('line_items')
    .insert({ ...data, line_total: lineTotal })
    .select()
    .single()
  if (error) throw error
  return newItem
}

export async function updateLineItem(id: string, data: LineItemUpdate): Promise<LineItem> {
  const supabase = createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('line_items')
    .select('quantity, unit_price')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const updateData = {
    ...data,
    line_total: calculateLineGross(
      data.quantity ?? existing.quantity,
      data.unit_price ?? existing.unit_price
    ),
  }

  const { data: updatedItem, error } = await supabase
    .from('line_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updatedItem
}

export async function deleteLineItem(id: string): Promise<void> {
  const supabase = createClient()
  await softDeleteRecord(supabase, 'line_items', id)
}

export async function reorderLineItems(
  items: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('line_items')
    .upsert(items, { onConflict: 'id' })
  if (error) throw error
}
