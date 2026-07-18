import { createClient } from '@/lib/supabase/client'
import type { ServicePackage, ServicePackageInsert, ServicePackageUpdate } from '@/lib/types'

const PACKAGE_SELECT = '*, items:package_items(*)'

export async function getServicePackages(): Promise<ServicePackage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_packages')
    .select(PACKAGE_SELECT)
    .is('deleted_at', null)
    .order('sort_order')
  if (error) throw error
  return data as unknown as ServicePackage[]
}

export async function createServicePackage(data: ServicePackageInsert): Promise<ServicePackage> {
  const supabase = createClient()
  const { items, ...packageData } = data
  const { data: newPackage, error: pErr } = await supabase
    .from('service_packages')
    .insert(packageData)
    .select()
    .single()
  if (pErr) throw pErr
  if (items && items.length > 0) {
    const { error: iErr } = await supabase
      .from('package_items')
      .insert(items.map((item, idx) => ({ ...item, package_id: newPackage.id, sort_order: idx })))
    if (iErr) throw iErr
  }
  return newPackage
}

export async function updateServicePackage(id: string, data: ServicePackageUpdate): Promise<ServicePackage> {
  const supabase = createClient()
  const { items, ...packageData } = data
  const { data: updated, error: pErr } = await supabase
    .from('service_packages')
    .update(packageData)
    .eq('id', id)
    .select()
    .single()
  if (pErr) throw pErr
  if (items) {
    await supabase.from('package_items').delete().eq('package_id', id)
    if (items.length > 0) {
      const { error: iErr } = await supabase
        .from('package_items')
        .insert(items.map((item, idx) => ({ ...item, package_id: id, sort_order: idx })))
      if (iErr) throw iErr
    }
  }
  return updated
}

export async function deleteServicePackage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('service_packages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
