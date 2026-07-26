import type { SupabaseClient } from '@supabase/supabase-js'

export type SoftDeleteTable =
  | 'attachments'
  | 'customers'
  | 'documents'
  | 'labor_items'
  | 'line_items'
  | 'notifications'
  | 'package_items'
  | 'payments'
  | 'photos'
  | 'service_packages'
  | 'shop_settings'
  | 'vehicles'
  | 'work_orders'

export async function softDeleteRecord(
  client: SupabaseClient,
  table: SoftDeleteTable,
  id: string,
): Promise<void> {
  const { data, error } = await client.rpc('soft_delete_record', {
    target_table: table,
    target_id: id,
  })
  if (error) throw error
  if (data !== true) throw new Error('Record was not found or was already deleted')
}

export async function restoreRecord(
  client: SupabaseClient,
  table: SoftDeleteTable,
  id: string,
): Promise<void> {
  const { data, error } = await client.rpc('restore_record', {
    target_table: table,
    target_id: id,
  })
  if (error) throw error
  if (data !== true) throw new Error('Record was not found or is already active')
}
