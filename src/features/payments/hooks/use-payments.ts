'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayments, createPayment, updatePayment, deletePayment } from '../actions'
import type { PaymentInsert, PaymentUpdate } from '@/lib/types'
import { queryKeys } from '@/lib/query/keys'

export function usePayments(workOrderId: string) {
  return useQuery({
    queryKey: queryKeys.payments.byWorkOrder(workOrderId),
    queryFn: () => getPayments(workOrderId),
    enabled: !!workOrderId,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byWorkOrder(variables.work_order_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(variables.work_order_id) })
    },
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentUpdate }) => updatePayment(id, data),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byWorkOrder(payment.work_order_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(payment.work_order_id) })
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; workOrderId: string }) => deletePayment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byWorkOrder(variables.workOrderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(variables.workOrderId) })
    },
  })
}
