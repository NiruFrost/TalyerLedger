import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types'

export async function getCustomers(): Promise<Customer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function createCustomer(data: CustomerInsert): Promise<Customer> {
  const supabase = createClient()
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return newCustomer
}

export async function updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
  const supabase = createClient()
  const { data: updatedCustomer, error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updatedCustomer
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
