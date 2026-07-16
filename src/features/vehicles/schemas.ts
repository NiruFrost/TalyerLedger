import { z } from 'zod'

export const vehicleSchema = z.object({
  customer_id: z.string().optional().or(z.literal('')),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(2030),
  engine: z.string().optional().or(z.literal('')),
  transmission: z.string().optional().or(z.literal('')),
  vin: z.string().optional().or(z.literal('')),
  plate: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>
