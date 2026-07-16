'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lineItemFormSchema, type LineItemFormValues } from '../schemas'
import { useCreateLineItem, useUpdateLineItem } from '../hooks/use-line-items'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UnitCombobox } from '@/components/ui/unit-combobox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LineItem, LineItemCategory } from '@/lib/types'

interface LineItemFormProps {
  jobId: string
  defaultValues?: LineItem
  onSuccess?: () => void
  onCancel?: () => void
}

export function LineItemForm({ jobId, defaultValues, onSuccess, onCancel }: LineItemFormProps) {
  const createLineItem = useCreateLineItem()
  const updateLineItem = useUpdateLineItem()
  const isEditing = !!defaultValues

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LineItemFormValues>({
    resolver: zodResolver(lineItemFormSchema),
    defaultValues: defaultValues
      ? {
          id: defaultValues.id,
          category: defaultValues.category,
          item: defaultValues.item,
          specification: defaultValues.specification || '',
          installation_status: defaultValues.installation_status || '',
          quantity: defaultValues.quantity,
          unit: defaultValues.unit,
          unit_price: defaultValues.unit_price,
          discount_type: defaultValues.discount_type || '',
          discount_value: defaultValues.discount_value || 0,
          notes: defaultValues.notes || '',
          sort_order: defaultValues.sort_order,
        }
      : {
          category: 'parts',
          item: '',
          specification: '',
          installation_status: '',
          quantity: 1,
          unit: 'pc',
          unit_price: 0,
          discount_type: '',
          discount_value: 0,
          notes: '',
          sort_order: 0,
        },
  })

  async function onSubmit(data: LineItemFormValues) {
    const payload = {
      job_id: jobId,
      category: data.category as LineItemCategory,
      item: data.item,
      specification: data.specification || null,
      part_number: data.part_number || null,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unit_price,
      notes: data.notes || null,
      sort_order: defaultValues?.sort_order ?? 0,
    }

    if (isEditing && defaultValues) {
      await updateLineItem.mutateAsync({ id: defaultValues.id, data: payload })
    } else {
      await createLineItem.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watch('category')}
            onValueChange={(value) => setValue('category', value as LineItemFormValues['category'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_ITEM_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item">Item *</Label>
          <Input id="item" {...register('item')} />
          {errors.item && <p className="text-sm text-red-500">{errors.item.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specification">Specification</Label>
        <Input id="specification" {...register('specification')} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input id="quantity" type="number" step="any" {...register('quantity')} />
          {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <UnitCombobox
            value={watch('unit')}
            onChange={(value) => setValue('unit', value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price *</Label>
          <Input id="unit_price" type="number" step="any" {...register('unit_price')} />
          {errors.unit_price && <p className="text-sm text-red-500">{errors.unit_price.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select
            value={watch('discount_type')}
            onValueChange={(value) => setValue('discount_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="percent">Percent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_value">Discount Value</Label>
          <Input id="discount_value" type="number" step="any" {...register('discount_value')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
