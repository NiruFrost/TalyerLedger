import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/lib/types'

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVehicle(data: VehicleInsert): Promise<Vehicle> {
  const supabase = createClient()
  const { data: newVehicle, error } = await supabase
    .from('vehicles')
    .insert(data)
    .select('*, customer:customers(*)')
    .single()
  if (error) throw error
  return newVehicle
}

export async function updateVehicle(id: string, data: VehicleUpdate): Promise<Vehicle> {
  const supabase = createClient()
  const { data: updatedVehicle, error } = await supabase
    .from('vehicles')
    .update(data)
    .eq('id', id)
    .select('*, customer:customers(*)')
    .single()
  if (error) throw error
  return updatedVehicle
}

export async function deleteVehicle(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('vehicles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
