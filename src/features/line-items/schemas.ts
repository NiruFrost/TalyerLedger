import { z } from 'zod'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'

export const lineItemFormSchema = z.object({
  id: z.string().optional(),
  category: z.enum(LINE_ITEM_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
  item: z.string().min(1, 'Item is required'),
  specification: z.string().optional().or(z.literal('')),
  part_number: z.string().optional().or(z.literal('')),
  installation_status: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().positive('Qty must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or more'),
  discount_type: z.string().optional().or(z.literal('')),
  discount_value: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
  sort_order: z.number(),
})

export type LineItemFormValues = z.infer<typeof lineItemFormSchema>
