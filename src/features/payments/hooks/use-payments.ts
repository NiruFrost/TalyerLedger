'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayments, createPayment, updatePayment, deletePayment } from '../actions'
import type { PaymentInsert, PaymentUpdate } from '@/lib/types'

export function usePayments(workOrderId: string) {
  return useQuery({
    queryKey: ['payments', workOrderId],
    queryFn: () => getPayments(workOrderId),
    enabled: !!workOrderId,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.work_order_id] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentUpdate }) => updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; workOrderId: string }) => deletePayment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.workOrderId] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}
