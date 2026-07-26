'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServicePackages, createServicePackage, updateServicePackage, deleteServicePackage } from '../actions'
import type { ServicePackageInsert, ServicePackageUpdate } from '@/lib/types'
import { queryKeys } from '@/lib/query/keys'

export function useServicePackages() {
  return useQuery({ queryKey: queryKeys.servicePackages.all, queryFn: getServicePackages })
}

export function useCreateServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ServicePackageInsert) => createServicePackage(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.servicePackages.all }),
  })
}

export function useUpdateServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicePackageUpdate }) => updateServicePackage(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.servicePackages.all }),
  })
}

export function useDeleteServicePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteServicePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.servicePackages.all }),
  })
}
