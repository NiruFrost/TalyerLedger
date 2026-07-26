import { createClient } from '@/lib/supabase/client'
import { softDeleteRecord } from '@/lib/database/soft-delete'
import type { LaborItem, LaborItemInsert, LaborItemUpdate } from '@/lib/types'

export async function getLaborItems(): Promise<LaborItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('labor_items')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createLaborItem(data: LaborItemInsert): Promise<LaborItem> {
  const supabase = createClient()
  const { data: newItem, error } = await supabase
    .from('labor_items')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return newItem
}

export async function updateLaborItem(id: string, data: LaborItemUpdate): Promise<LaborItem> {
  const supabase = createClient()
  const { data: updated, error } = await supabase
    .from('labor_items')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated
}

export async function deleteLaborItem(id: string): Promise<void> {
  const supabase = createClient()
  await softDeleteRecord(supabase, 'labor_items', id)
}
