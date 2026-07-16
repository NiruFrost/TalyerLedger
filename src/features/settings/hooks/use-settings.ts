'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShopSettings, updateShopSettings, type ShopSettingsUpdate } from '../actions'

export function useShopSettings() {
  return useQuery({
    queryKey: ['shop-settings'],
    queryFn: getShopSettings,
  })
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShopSettingsUpdate) => updateShopSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] })
    },
  })
}
