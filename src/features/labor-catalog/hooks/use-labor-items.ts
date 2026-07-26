'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLaborItems, createLaborItem, updateLaborItem, deleteLaborItem } from '../actions'
import type { LaborItemInsert, LaborItemUpdate } from '@/lib/types'
import { queryKeys } from '@/lib/query/keys'

export function useLaborItems() {
  return useQuery({ queryKey: queryKeys.laborItems.all, queryFn: getLaborItems })
}

export function useCreateLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LaborItemInsert) => createLaborItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.laborItems.all }),
  })
}

export function useUpdateLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LaborItemUpdate }) => updateLaborItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.laborItems.all }),
  })
}

export function useDeleteLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLaborItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.laborItems.all }),
  })
}
