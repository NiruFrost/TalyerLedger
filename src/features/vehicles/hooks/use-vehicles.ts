'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVehicles,
  getVehicleById,
  getVehiclesByCustomer,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../actions'
import type { VehicleInsert, VehicleUpdate } from '@/lib/types'

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  })
}

export function useVehiclesByCustomer(customerId: string) {
  return useQuery({
    queryKey: ['vehicles', 'customer', customerId],
    queryFn: () => getVehiclesByCustomer(customerId),
    enabled: !!customerId,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleInsert) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleUpdate }) =>
      updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
