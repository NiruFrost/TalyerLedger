'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wrench, FileText, CreditCard, AlertTriangle, Clock } from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'work_order' | 'estimate' | 'invoice' | 'payment' | 'note'
  title: string
  subtitle?: string
  amount?: number
  status?: string
  date: string
}

export function VehicleTimeline({ vehicleId }: { vehicleId: string }) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['vehicle-timeline', vehicleId],
    queryFn: async () => {
      const supabase = createClient()
      const events_: TimelineEvent[] = []

      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, order_no, status, created_at')
        .eq('vehicle_id', vehicleId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      for (const wo of workOrders ?? []) {
        events_.push({ id: wo.id, type: 'work_order', title: `Work Order #${wo.order_no}`, subtitle: wo.status, status: wo.status, date: wo.created_at })
      }

      return events_.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
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

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-0">
        {evts.map((evt, idx) => {
          const Icon = iconForType(evt.type)
          const color = colorForType(evt.type)
          return (
            <div key={evt.id} className="relative flex gap-4 pb-6 last:pb-0">
              {idx < evts.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-medium">{evt.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(evt.date)}</span>
                  {evt.subtitle && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{evt.subtitle}</span>
                    </>
                  )}
                  {evt.amount !== undefined && evt.amount > 0 && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{formatCurrency(evt.amount)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function iconForType(type: TimelineEvent['type']) {
  switch (type) {
    case 'work_order': return Wrench
    case 'estimate': return FileText
    case 'invoice': return CreditCard
    case 'payment': return CreditCard
    case 'note': return AlertTriangle
    default: return Clock
  }
}

function colorForType(type: TimelineEvent['type']) {
  switch (type) {
    case 'work_order': return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
    case 'estimate': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
    case 'invoice': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
    case 'payment': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
    case 'note': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300'
  }
}
