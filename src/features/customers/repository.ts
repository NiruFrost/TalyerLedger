import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { restoreRecord, softDeleteRecord } from '@/lib/database/soft-delete'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types'

export interface CustomerRepository {
  listActive(): Promise<Customer[]>
  findActiveById(id: string): Promise<Customer | null>
  create(data: CustomerInsert): Promise<Customer>
  update(id: string, data: CustomerUpdate): Promise<Customer>
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
}

export function createSupabaseCustomerRepository(
  client: SupabaseClient = createClient(),
): CustomerRepository {
  return {
    async listActive() {
      const { data, error } = await client
        .from('customers')
        .select('*, vehicles:vehicles(count)')
        .is('deleted_at', null)
        .is('vehicles.deleted_at', null)
        .order('name')
        .limit(100)
      if (error) throw error
      return data as unknown as Customer[]
    },

    async findActiveById(id) {
      const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data as Customer | null
    },

    async create(input) {
      const { data, error } = await client.from('customers').insert(input).select().single()
      if (error) throw error
      return data as Customer
    },

    async update(id, input) {
      const { data, error } = await client
        .from('customers')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Customer
    },

    async softDelete(id) {
      await softDeleteRecord(client, 'customers', id)
    },

    async restore(id) {
      await restoreRecord(client, 'customers', id)
    },
  }
}
