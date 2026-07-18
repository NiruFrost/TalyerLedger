import { createClient } from '@/lib/supabase/client'
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
  const { error } = await supabase
    .from('labor_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
