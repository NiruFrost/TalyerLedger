import { z } from 'zod'
import { PAYMENT_TYPES } from '@/lib/constants'

export const paymentFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().min(1, 'Payment method is required'),
  payment_type: z.enum(PAYMENT_TYPES.map((pt) => pt.value) as [string, ...string[]]),
  reference_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>
