import { createClient } from '@/lib/supabase/client'

export interface ShopSettings {
  id: string
  shop_name: string
  address: string | null
  contact_number: string | null
  email: string | null
  logo_url: string | null
  tax_id: string | null
  terms_conditions: string | null
  tin: string | null
  dti_bn: string | null
  business_permit: string | null
  include_photo_appendix: boolean
}

export interface ShopSettingsUpdate {
  shop_name?: string
  address?: string | null
  contact_number?: string | null
  email?: string | null
  logo_url?: string | null
  tax_id?: string | null
  terms_conditions?: string | null
  tin?: string | null
  dti_bn?: string | null
  business_permit?: string | null
  include_photo_appendix?: boolean
}

export async function getShopSettings(): Promise<ShopSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .limit(1)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function updateShopSettings(data: ShopSettingsUpdate): Promise<ShopSettings> {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('shop_settings')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    const { data: updated, error } = await supabase
      .from('shop_settings')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  const { data: created, error } = await supabase
    .from('shop_settings')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return created
}
