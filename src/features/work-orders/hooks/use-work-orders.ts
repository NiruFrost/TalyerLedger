'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkOrders,
  getWorkOrderById,
  getWorkOrdersByVehicle,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  copyWorkOrder,
  restoreWorkOrder,
} from '../actions'
import type { WorkOrderInsert, WorkOrderUpdate } from '@/lib/types'

export function useWorkOrders() {
  return useQuery({
    queryKey: ['work-orders'],
    queryFn: getWorkOrders,
  })
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: () => getWorkOrderById(id),
    enabled: !!id,
  })
}

export function useWorkOrdersByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: ['work-orders', 'vehicle', vehicleId],
    queryFn: () => getWorkOrdersByVehicle(vehicleId),
    enabled: !!vehicleId,
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WorkOrderInsert) => createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkOrderUpdate }) =>
      updateWorkOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] })
    },
  })
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useCopyWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sourceId: string) => copyWorkOrder(sourceId),
    onSuccess: (newWorkOrder) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-orders', newWorkOrder.id] })
    },
  })
}

export function useRestoreWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}
