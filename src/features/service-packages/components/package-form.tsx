'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateServicePackage, useUpdateServicePackage } from '../hooks/use-service-packages'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { ServicePackage, ServicePackageInsert, PackageItem } from '@/lib/types'

const packageItemSchema = z.object({
  item_type: z.string().min(1),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(1),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.coerce.number().min(0),
})

const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  total_price: z.coerce.number().min(0).optional().nullable(),
  items: z.array(packageItemSchema).min(1, 'At least one item is required'),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
  defaultValues?: ServicePackage
  onSuccess?: () => void
  onCancel?: () => void
}

export function PackageForm({ defaultValues, onSuccess, onCancel }: PackageFormProps) {
  const createPackage = useCreateServicePackage()
  const updatePackage = useUpdateServicePackage()
  const isEditing = !!defaultValues

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: defaultValues ? {
      name: defaultValues.name,
      description: defaultValues.description ?? '',
      category: defaultValues.category,
      total_price: defaultValues.total_price ?? undefined,
      items: (defaultValues.items ?? []).map((i) => ({
        item_type: i.item_type,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
      })),
    } : {
      name: '',
      description: '',
      category: 'labor',
      total_price: undefined,
      items: [{ item_type: 'labor', name: '', quantity: 1, unit: 'service', unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const computedTotal = items?.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0) ?? 0

  async function onSubmit(data: PackageFormValues) {
    const payload = { ...data, total_price: data.total_price || computedTotal } as unknown as ServicePackageInsert
    if (isEditing && defaultValues) {
      await updatePackage.mutateAsync({ id: defaultValues.id, data: payload })
    } else {
      await createPackage.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Package Name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ item_type: 'labor', name: '', quantity: 1, unit: 'service', unit_price: 0 })}>
            <Plus className="mr-1 h-3 w-3" /> Add Item
          </Button>
        </div>
        {errors.items && <p className="text-sm text-red-500">{errors.items.message || errors.items.root?.message}</p>}
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-2 rounded-md border p-3">
              <div className="flex-1 grid grid-cols-5 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={watch(`items.${idx}.item_type`)} onValueChange={(v) => setValue(`items.${idx}.item_type`, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LINE_ITEM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8 text-xs" {...register(`items.${idx}.name`)} />
                </div>
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input className="h-8 text-xs" type="number" min="1" {...register(`items.${idx}.quantity`)} />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input className="h-8 text-xs" {...register(`items.${idx}.unit`)} />
                </div>
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input className="h-8 text-xs" type="number" step="any" {...register(`items.${idx}.unit_price`)} />
                </div>
              </div>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 mt-5 shrink-0 text-red-500" onClick={() => remove(idx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end text-sm font-mono">
          Total: {formatCurrency(computedTotal)}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create Package'}
        </Button>
      </div>
    </form>
  )
}
