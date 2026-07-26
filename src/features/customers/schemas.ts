import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160, 'Name is too long'),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(40, 'Phone number is too long').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address is too long').optional().or(z.literal('')),
  notes: z.string().trim().max(5000, 'Notes are too long').optional().or(z.literal('')),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
