import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseCustomerRepository } from './repository'

describe('Supabase customer repository', () => {
  it('uses the active-row filter and a bounded list query', async () => {
    const customer = {
      id: 'customer-1',
      name: 'Fleet Owner',
      email: null,
      phone: null,
      address: null,
      notes: null,
      created_at: '2026-07-23T00:00:00Z',
      updated_at: '2026-07-23T00:00:00Z',
      created_by: null,
      updated_by: null,
      deleted_at: null,
    }
    const chain = {
      select: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    }
    chain.select.mockReturnValue(chain)
    chain.is.mockReturnValue(chain)
    chain.order.mockReturnValue(chain)
    chain.limit.mockResolvedValue({ data: [customer], error: null })
    const client = { from: vi.fn().mockReturnValue(chain) } as unknown as SupabaseClient

    const result = await createSupabaseCustomerRepository(client).listActive()

    expect(client.from).toHaveBeenCalledWith('customers')
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
    expect(chain.limit).toHaveBeenCalledWith(100)
    expect(result).toEqual([customer])
  })
})
