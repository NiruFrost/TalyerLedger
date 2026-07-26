'use client'

import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Wrench } from 'lucide-react'
import { getVehicleTimeline, type TimelineEvent } from '../timeline'
import { queryKeys } from '@/lib/query/keys'

export function VehicleTimeline({ vehicleId }: { vehicleId: string }) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: queryKeys.vehicles.timeline(vehicleId),
    queryFn: () => getVehicleTimeline(vehicleId),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load timeline.</div>
  }

  const evts = events ?? []

  if (evts.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No activity yet for this vehicle.</div>
  }

  const grouped: Record<number, TimelineEvent[]> = {}
  for (const evt of evts) {
    if (!grouped[evt.year]) grouped[evt.year] = []
    grouped[evt.year].push(evt)
  }

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <h3 className="text-lg font-bold mb-4">{year}</h3>
          <div className="space-y-0">
            {grouped[year].map((evt, idx) => {
              const isLast = idx === grouped[year].length - 1
              const d = parseISO(evt.date)
              return (
                <div key={evt.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{format(d, 'MMM d')}</span>
                      <span className="text-sm">{evt.title}</span>
                    </div>
                    {evt.status && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{evt.status.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
