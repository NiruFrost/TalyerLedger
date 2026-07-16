'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLineItemsByJob,
  createLineItem,
  updateLineItem,
  deleteLineItem,
  reorderLineItems,
} from '../actions'
import type { LineItemInsert, LineItemUpdate } from '@/lib/types'

export function useLineItems(jobId: string) {
  return useQuery({
    queryKey: ['line-items', jobId],
    queryFn: () => getLineItemsByJob(jobId),
    enabled: !!jobId,
  })
}

export function useCreateLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LineItemInsert) => createLineItem(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', data.job_id] })
      queryClient.invalidateQueries({ queryKey: ['jobs', data.job_id] })
    },
  })
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LineItemUpdate }) =>
      updateLineItem(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', data.job_id] })
      queryClient.invalidateQueries({ queryKey: ['jobs', data.job_id] })
    },
  })
}

export function useDeleteLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; jobId: string }) => deleteLineItem(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] })
    },
  })
}

export function useReorderLineItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      reorderLineItems(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line-items'] })
    },
  })
}
