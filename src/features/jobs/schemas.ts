import { z } from 'zod'
import { JOB_STATUSES, CURRENCIES } from '@/lib/constants'
import { lineItemFormSchema } from '@/features/line-items/schemas'

export const jobFormSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  customer_id: z.string().optional().or(z.literal('')),
  status: z.enum(JOB_STATUSES.map((s) => s.value) as [string, ...string[]]),
  payer_type: z.string().optional().or(z.literal('')),
  insurance_company: z.string().optional().or(z.literal('')),
  insurance_policy_no: z.string().optional().or(z.literal('')),
  insurance_claim_no: z.string().optional().or(z.literal('')),
  linked_job_id: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  prepared_by: z.string().optional().or(z.literal('')),
  odometer: z.coerce.number().optional(),
  currency: z.enum(CURRENCIES.map((c) => c.value) as [string, ...string[]]),
  overall_discount_type: z.string().optional().or(z.literal('')),
  overall_discount_value: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  line_items: z.array(lineItemFormSchema),
})

export type JobFormValues = z.infer<typeof jobFormSchema>
