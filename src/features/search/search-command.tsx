'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Car, Users, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { customers: [], vehicles: [], jobs: [] }

      const term = `%${query}%`

      const [customersRes, vehiclesRes, jobsRes] = await Promise.all([
        supabase.from('customers').select('id, name').ilike('name', term).is('deleted_at', null).limit(5),
        supabase.from('vehicles').select('id, make, model, plate, vin').or(`plate.ilike.${term},vin.ilike.${term},make.ilike.${term},model.ilike.${term}`).is('deleted_at', null).limit(5),
        supabase.from('jobs').select('id, estimate_no').ilike('estimate_no', term).is('deleted_at', null).limit(5),
      ])

      return {
        customers: customersRes.data ?? [],
        vehicles: vehiclesRes.data ?? [],
        jobs: jobsRes.data ?? [],
      }
    },
    enabled: query.length >= 2,
  })

  const handleSelect = useCallback(
    (type: string, id: string) => {
      setOpen(false)
      setQuery('')
      router.push(`/${type}s/${id}`)
    },
    [router]
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search customers, vehicles, jobs..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results && (
            <>
              {results.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => handleSelect('customer', c.id)}>
                      <Users className="mr-2 h-4 w-4" />
                      {c.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.vehicles.length > 0 && (
                <CommandGroup heading="Vehicles">
                  {results.vehicles.map((v) => (
                    <CommandItem key={v.id} onSelect={() => handleSelect('vehicle', v.id)}>
                      <Car className="mr-2 h-4 w-4" />
                      {v.make} {v.model} — {v.plate || v.vin || 'N/A'}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.jobs.length > 0 && (
                <CommandGroup heading="Jobs">
                  {results.jobs.map((j) => (
                    <CommandItem key={j.id} onSelect={() => handleSelect('job', j.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {j.estimate_no}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
