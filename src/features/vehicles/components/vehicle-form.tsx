'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema, type VehicleFormValues } from '../schemas'
import { useCreateVehicle, useUpdateVehicle } from '../hooks/use-vehicles'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Vehicle } from '@/lib/types'

interface VehicleFormProps {
  defaultValues?: Partial<Vehicle>
  onSuccess?: () => void
  onCancel?: () => void
}

export function VehicleForm({ defaultValues, onSuccess, onCancel }: VehicleFormProps) {
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const { customers } = useCustomers()
  const isEditing = !!defaultValues?.id

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: defaultValues
      ? {
          customer_id: defaultValues.customer_id || '',
          make: defaultValues.make,
          model: defaultValues.model,
          year: defaultValues.year,
          engine: defaultValues.engine || '',
          transmission: defaultValues.transmission || '',
          vin: defaultValues.vin || '',
          plate: defaultValues.plate || '',
          color: defaultValues.color || '',
          notes: defaultValues.notes || '',
        }
      : {
          customer_id: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          engine: '',
          transmission: '',
          vin: '',
          plate: '',
          color: '',
          notes: '',
        },
  })

  const selectedCustomerId = watch('customer_id')

  async function onSubmit(data: VehicleFormValues) {
    const payload = {
      customer_id: data.customer_id || null,
      make: data.make,
      model: data.model,
      year: data.year,
      engine: data.engine || null,
      transmission: data.transmission || null,
      vin: data.vin || null,
      plate: data.plate || null,
      color: data.color || null,
      notes: data.notes || null,
    }

    if (isEditing && defaultValues) {
      await updateVehicle.mutateAsync({ id: defaultValues.id!, data: payload })
    } else {
      await createVehicle.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer_id">Customer</Label>
        <Select
          value={selectedCustomerId}
          onValueChange={(value) => setValue('customer_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make *</Label>
          <Input id="make" {...register('make')} />
          {errors.make && <p className="text-sm text-red-500">{errors.make.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input id="model" {...register('model')} />
          {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" {...register('year')} />
          {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" {...register('color')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="engine">Engine</Label>
          <Input id="engine" {...register('engine')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Input id="transmission" {...register('transmission')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">VIN</Label>
          <Input id="vin" {...register('vin')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plate">Plate #</Label>
          <Input id="plate" {...register('plate')} />
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
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
