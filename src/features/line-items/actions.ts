import { createClient } from '@/lib/supabase/client'
import { calculateLineTotal } from '@/lib/utils'
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
  const lineTotal = calculateLineTotal(data.quantity ?? 0, data.unit_price ?? 0)

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
  const updateData = { ...data }
  if (data.quantity !== undefined || data.unit_price !== undefined) {
    const qty = data.quantity ?? 0
    const price = data.unit_price ?? 0
    updateData.line_total = calculateLineTotal(qty, price)
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
  const { error } = await supabase
    .from('line_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
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

export async function syncLineItems(
  workOrderId: string,
  items: Array<{
    id?: string
    category: string
    item: string
    specification?: string | null
    part_number?: string | null
    quantity: number
    unit: string
    unit_price: number
    discount_type?: string | null
    discount_value?: number
    installation_status?: string | null
    notes?: string | null
    sort_order: number
  }>
): Promise<void> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('line_items')
    .select('id')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)

  const existingIds = new Set(existing?.map((i) => i.id) || [])
  const formIds = new Set(items.filter((i) => i.id).map((i) => i.id!))

  const toDelete = [...existingIds].filter((id) => !formIds.has(id))
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('line_items')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', toDelete)
    if (delErr) throw delErr
  }

  for (const item of items) {
    const lineTotal = calculateLineTotal(item.quantity, item.unit_price)
    const lineData = {
      work_order_id: workOrderId,
      category: item.category,
      item: item.item,
      specification: item.specification || null,
      part_number: item.part_number || null,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      line_total: lineTotal,
      discount_type: item.discount_type || null,
      discount_value: item.discount_value || 0,
      installation_status: item.installation_status || null,
      notes: item.notes || null,
      sort_order: item.sort_order,
    }

    if (item.id && existingIds.has(item.id)) {
      const { error: updErr } = await supabase
        .from('line_items')
        .update(lineData)
        .eq('id', item.id)
      if (updErr) throw updErr
    } else {
      const { error: insErr } = await supabase
        .from('line_items')
        .insert(lineData)
      if (insErr) throw insErr
    }
  }
}


