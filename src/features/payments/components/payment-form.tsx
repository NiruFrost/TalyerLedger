'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentFormSchema, type PaymentFormValues } from '../schemas'
import { useCreatePayment, useUpdatePayment } from '../hooks/use-payments'
import { PAYMENT_TYPES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Payment, PaymentType } from '@/lib/types'

interface PaymentFormProps {
  jobId: string
  defaultValues?: Payment
  onSuccess?: () => void
  onCancel?: () => void
}

export function PaymentForm({ jobId, defaultValues, onSuccess, onCancel }: PaymentFormProps) {
  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()
  const isEditing = !!defaultValues

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: defaultValues
      ? {
          date: defaultValues.date.split('T')[0],
          amount: defaultValues.amount,
          payment_method: defaultValues.payment_method,
          payment_type: defaultValues.payment_type,
          reference_number: defaultValues.reference_number || '',
          notes: defaultValues.notes || '',
        }
      : {
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'cash',
          payment_type: 'regular',
          reference_number: '',
          notes: '',
        },
  })

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form

  async function onSubmit(data: PaymentFormValues) {
    if (isEditing && defaultValues) {
      await updatePayment.mutateAsync({
        id: defaultValues.id,
        data: { ...data, payment_type: data.payment_type as PaymentType, job_id: jobId },
      })
    } else {
      await createPayment.mutateAsync({ ...data, payment_type: data.payment_type as PaymentType, job_id: jobId })
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input id="amount" type="number" step="0.01" min="0.01" {...register('amount')} />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment Method *</Label>
        <Select
          value={watch('payment_method')}
          onValueChange={(value) => setValue('payment_method', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="debit_card">Debit Card</SelectItem>
            <SelectItem value="gcash">GCash</SelectItem>
            <SelectItem value="paymaya">PayMaya</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.payment_method && <p className="text-sm text-red-500">{errors.payment_method.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_type">Payment Type</Label>
        <Select
          value={watch('payment_type')}
          onValueChange={(value) => setValue('payment_type', value as PaymentType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_number">Reference Number</Label>
        <Input id="reference_number" {...register('reference_number')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Payment'}
        </Button>
      </div>
    </form>
  )
}
