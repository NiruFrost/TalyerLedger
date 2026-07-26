'use client'

import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Car, Users, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { searchWorkshop } from './actions'
import { queryKeys } from '@/lib/query/keys'
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
  const deferredQuery = useDeferredValue(query.trim())

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

  const { data: results, isError } = useQuery({
    queryKey: queryKeys.search.results(deferredQuery),
    queryFn: () => searchWorkshop(deferredQuery),
    enabled: deferredQuery.length >= 2,
  })

  const handleSelect = useCallback(
    (type: string, id: string) => {
      setOpen(false)
      setQuery('')
      const route = type === 'work_order' ? `/jobs/${id}` : `/${type}s/${id}`
      router.push(route)
    },
    [router]
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search customers, vehicles, jobs..."
          value={query}
          onValueChange={(value) => setQuery(value.slice(0, 80))}
        />
        <CommandList>
          <CommandEmpty>{isError ? 'Search is unavailable. Try again.' : 'No results found.'}</CommandEmpty>
          {results && (
            <>
              {results.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => handleSelect('customer', c.id)}>
                      <Users className="mr-2 h-4 w-4" />
                      {c.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.vehicles.length > 0 && (
                <CommandGroup heading="Vehicles">
                  {results.vehicles.map((v) => (
                    <CommandItem key={v.id} onSelect={() => handleSelect('vehicle', v.id)}>
                      <Car className="mr-2 h-4 w-4" />
                      {v.label} — {v.detail || 'N/A'}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.workOrders.length > 0 && (
                <CommandGroup heading="Jobs">
                  {results.workOrders.map((j) => (
                    <CommandItem key={j.id} onSelect={() => handleSelect('work_order', j.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {j.label}
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
