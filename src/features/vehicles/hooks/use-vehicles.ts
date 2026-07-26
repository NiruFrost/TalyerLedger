'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVehicles,
  getVehicleById,
  getVehiclesByCustomer,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  restoreVehicle,
} from '../actions'
import type { VehicleInsert, VehicleUpdate } from '@/lib/types'
import { queryKeys } from '@/lib/query/keys'

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: getVehicles,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  })
}

export function useVehiclesByCustomer(customerId: string) {
  return useQuery({
    queryKey: queryKeys.vehicles.byCustomer(customerId),
    queryFn: () => getVehiclesByCustomer(customerId),
    enabled: !!customerId,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdate }) =>
      updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(variables.id) })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all })
    },
  })
}

export function useRestoreVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all })
    },
  })
}
