import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types'
import { createSupabaseCustomerRepository } from './repository'

export async function getCustomers(): Promise<Customer[]> {
  return createSupabaseCustomerRepository().listActive()
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return createSupabaseCustomerRepository().findActiveById(id)
}

export async function createCustomer(data: CustomerInsert): Promise<Customer> {
  return createSupabaseCustomerRepository().create(data)
}

export async function updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
  return createSupabaseCustomerRepository().update(id, data)
}

export async function deleteCustomer(id: string): Promise<void> {
  return createSupabaseCustomerRepository().softDelete(id)
}

export async function restoreCustomer(id: string): Promise<void> {
  return createSupabaseCustomerRepository().restore(id)
}
