'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateLaborItem, useUpdateLaborItem } from '../hooks/use-labor-items'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LaborItem, LineItemCategory } from '@/lib/types'

const laborItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1),
  unit_price: z.coerce.number().min(0),
  unit: z.string().min(1, 'Unit is required'),
})

type LaborItemFormValues = z.infer<typeof laborItemSchema>

interface LaborItemFormProps {
  defaultValues?: LaborItem
  onSuccess?: () => void
  onCancel?: () => void
}

export function LaborItemForm({ defaultValues, onSuccess, onCancel }: LaborItemFormProps) {
  const createItem = useCreateLaborItem()
  const updateItem = useUpdateLaborItem()
  const isEditing = !!defaultValues

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<LaborItemFormValues>({
    resolver: zodResolver(laborItemSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      category: defaultValues?.category || 'labor',
      unit_price: defaultValues?.unit_price || 0,
      unit: defaultValues?.unit || 'service',
    },
  })

  async function onSubmit(data: LaborItemFormValues) {
    const payload = { ...data, category: data.category as LineItemCategory }
    if (isEditing && defaultValues) {
      await updateItem.mutateAsync({ id: defaultValues.id, data: payload })
    } else {
      await createItem.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LINE_ITEM_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit_price">Price *</Label>
          <Input id="unit_price" type="number" step="any" {...register('unit_price')} />
          {errors.unit_price && <p className="text-sm text-red-500">{errors.unit_price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Input id="unit" {...register('unit')} />
          {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
