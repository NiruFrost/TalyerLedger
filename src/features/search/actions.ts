import { createClient } from '@/lib/supabase/client'

export interface SearchResult {
  entity_type: 'customer' | 'vehicle' | 'work_order'
  id: string
  label: string
  detail: string | null
}

export interface GroupedSearchResults {
  customers: SearchResult[]
  vehicles: SearchResult[]
  workOrders: SearchResult[]
}

const EMPTY_RESULTS: GroupedSearchResults = {
  customers: [],
  vehicles: [],
  workOrders: [],
}

export async function searchWorkshop(rawTerm: string): Promise<GroupedSearchResults> {
  const searchTerm = rawTerm.trim().slice(0, 80)
  if (searchTerm.length < 2) return EMPTY_RESULTS

  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_workshop', {
    search_term: searchTerm,
    result_limit: 5,
  })
  if (error) throw error

  const results = (data ?? []) as SearchResult[]
  return {
    customers: results.filter((result) => result.entity_type === 'customer'),
    vehicles: results.filter((result) => result.entity_type === 'vehicle'),
    workOrders: results.filter((result) => result.entity_type === 'work_order'),
  }
}
