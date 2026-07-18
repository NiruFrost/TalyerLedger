'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServicePackages, createServicePackage, updateServicePackage, deleteServicePackage } from '../actions'
import type { ServicePackageInsert, ServicePackageUpdate } from '@/lib/types'

export function useServicePackages() {
  return useQuery({ queryKey: ['service-packages'], queryFn: getServicePackages })
}

export function useCreateServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ServicePackageInsert) => createServicePackage(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-packages'] }),
  })
}

export function useUpdateServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicePackageUpdate }) => updateServicePackage(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-packages'] }),
  })
}

export function useDeleteServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteServicePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-packages'] }),
  })
}
