'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayments, createPayment, updatePayment, deletePayment } from '../actions'
import type { PaymentInsert, PaymentUpdate } from '@/lib/types'

export function usePayments(jobId: string) {
  return useQuery({
    queryKey: ['payments', jobId],
    queryFn: () => getPayments(jobId),
    enabled: !!jobId,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentInsert) => createPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.job_id] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentUpdate }) => updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; jobId: string }) => deletePayment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
