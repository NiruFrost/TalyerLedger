'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLineItemsByWorkOrder,
  createLineItem,
  updateLineItem,
  deleteLineItem,
  reorderLineItems,
} from '../actions'
import type { LineItemInsert, LineItemUpdate } from '@/lib/types'

export function useLineItems(workOrderId: string) {
  return useQuery({
    queryKey: ['line-items', workOrderId],
    queryFn: () => getLineItemsByWorkOrder(workOrderId),
    enabled: !!workOrderId,
  })
}

export function useCreateLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LineItemInsert) => createLineItem(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', data.work_order_id] })
      queryClient.invalidateQueries({ queryKey: ['work-orders', data.work_order_id] })
    },
  })
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LineItemUpdate }) =>
      updateLineItem(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', data.work_order_id] })
      queryClient.invalidateQueries({ queryKey: ['work-orders', data.work_order_id] })
    },
  })
}

export function useDeleteLineItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; workOrderId: string }) => deleteLineItem(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', variables.workOrderId] })
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] })
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
