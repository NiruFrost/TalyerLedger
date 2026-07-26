'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShopSettings, updateShopSettings, type ShopSettingsUpdate } from '../actions'
import { queryKeys } from '@/lib/query/keys'

export function useShopSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail,
    queryFn: getShopSettings,
  })
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShopSettingsUpdate) => updateShopSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.detail })
    },
  })
}
