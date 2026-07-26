'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkOrders,
  getWorkOrderById,
  getWorkOrdersByVehicle,
  createWorkOrder,
  createWorkOrderWithItems,
  transitionWorkOrderStatus,
  updateWorkOrderWithItems,
  deleteWorkOrder,
  copyWorkOrder,
  restoreWorkOrder,
} from '../actions'
import type { WorkOrderLineInput } from '../actions'
import type { WorkOrderInsert, WorkOrderStatus, WorkOrderUpdate } from '@/lib/types'
import { queryKeys } from '@/lib/query/keys'

export function useWorkOrders() {
  return useQuery({
    queryKey: queryKeys.workOrders.all,
    queryFn: getWorkOrders,
  })
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.workOrders.detail(id),
    queryFn: () => getWorkOrderById(id),
    enabled: !!id,
  })
}

export function useWorkOrdersByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: queryKeys.workOrders.byVehicle(vehicleId),
    queryFn: () => getWorkOrdersByVehicle(vehicleId),
    enabled: !!vehicleId,
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WorkOrderInsert) => createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
    },
  })
}

export function useCreateWorkOrderWithItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, lineItems }: { data: WorkOrderInsert; lineItems: WorkOrderLineInput[] }) =>
      createWorkOrderWithItems(data, lineItems),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all }),
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      expectedVersion,
      status,
    }: {
      id: string
      expectedVersion: number
      status: WorkOrderStatus
    }) => transitionWorkOrderStatus(id, expectedVersion, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(variables.id) })
    },
  })
}

export function useUpdateWorkOrderWithItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      expectedVersion,
      data,
      lineItems,
    }: {
      id: string
      expectedVersion: number
      data: WorkOrderUpdate
      lineItems: WorkOrderLineInput[]
    }) => updateWorkOrderWithItems(id, expectedVersion, data, lineItems),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(variables.id) })
    },
  })
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
    },
  })
}

export function useCopyWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sourceId: string) => copyWorkOrder(sourceId),
    onSuccess: (newWorkOrder) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.detail(newWorkOrder.id) })
    },
  })
}

export function useRestoreWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all })
    },
  })
}
