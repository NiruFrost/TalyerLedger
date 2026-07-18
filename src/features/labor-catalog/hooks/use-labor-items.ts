'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLaborItems, createLaborItem, updateLaborItem, deleteLaborItem } from '../actions'
import type { LaborItemInsert, LaborItemUpdate } from '@/lib/types'

export function useLaborItems() {
  return useQuery({ queryKey: ['labor-items'], queryFn: getLaborItems })
}

export function useCreateLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LaborItemInsert) => createLaborItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor-items'] }),
  })
}

export function useUpdateLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LaborItemUpdate }) => updateLaborItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor-items'] }),
  })
}

export function useDeleteLaborItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLaborItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor-items'] }),
  })
}
