'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { jobFormSchema, type JobFormValues } from '../schemas'
import { useCreateJob, useUpdateJob } from '../hooks/use-jobs'
import { syncLineItems } from '@/features/line-items/actions'
import { getPaymentsTotal } from '@/features/jobs/actions'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import { JOB_STATUSES, CURRENCIES, LINE_ITEM_CATEGORIES, INSTALLATION_STATUSES, UNITS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Job, JobStatus, CurrencyCode, LineItemCategory, InstallationStatus, DiscountType } from '@/lib/types'

interface JobFormProps {
  defaultValues?: Partial<Job>
  onSuccess?: () => void
  onCancel?: () => void
}

function computeGross(qty: number, price: number): number {
  return Math.round(qty * price * 100) / 100
}

function computeNet(gross: number, discType: string, discVal: number): number {
  if (!discType || discVal <= 0) return gross
  if (discType === 'amount') return Math.max(0, gross - discVal)
  if (discType === 'percent') return Math.max(0, gross - (gross * discVal / 100))
  return gross
}

const INSTALLATION_STYLE: Record<string, string> = {
  to_confirm: 'bg-amber-100 text-amber-800 border-amber-300',
  ordered: 'bg-violet-100 text-violet-800 border-violet-300',
  in_stock: 'bg-blue-100 text-blue-800 border-blue-300',
  installed: 'bg-green-100 text-green-800 border-green-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  na: 'bg-gray-100 text-gray-800 border-gray-300',
}

export function JobForm({ defaultValues, onSuccess, onCancel }: JobFormProps) {
  const createJob = useCreateJob()
  const updateJob = useUpdateJob()
  const { customers } = useCustomers()
  const { data: vehicles } = useVehicles()
  const isEditing = !!defaultValues?.id

  const { data: paidAmount = 0 } = useQuery({
    queryKey: ['payments-total', defaultValues?.id],
    queryFn: () => getPaymentsTotal(defaultValues!.id!),
    enabled: !!defaultValues?.id,
  })

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: defaultValues
      ? {
          vehicle_id: defaultValues.vehicle_id || '',
          customer_id: defaultValues.customer_id || '',
          status: defaultValues.status || 'draft',
          date: (defaultValues.date || new Date().toISOString()).split('T')[0],
          prepared_by: defaultValues.prepared_by || '',
          odometer: defaultValues.odometer ?? undefined,
          currency: defaultValues.currency || 'PHP',
          overall_discount_type: defaultValues.overall_discount_type || '',
          overall_discount_value: defaultValues.overall_discount_value || 0,
          notes: defaultValues.notes || '',
          terms: defaultValues.terms || '',
          line_items: (defaultValues.line_items || []).map((li, i) => ({
            id: li.id,
            category: li.category,
            item: li.item,
            specification: li.specification || '',
            installation_status: li.installation_status || '',
            quantity: li.quantity,
            unit: li.unit,
            unit_price: li.unit_price,
            discount_type: li.discount_type || '',
            discount_value: li.discount_value || 0,
            notes: li.notes || '',
            sort_order: i,
          })),
        }
      : {
          vehicle_id: '',
          customer_id: '',
          status: 'draft',
          date: new Date().toISOString().split('T')[0],
          prepared_by: '',
          odometer: undefined,
          currency: 'PHP',
          overall_discount_type: '',
          overall_discount_value: 0,
          notes: '',
          terms: '',
          line_items: [],
        },
  })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'line_items',
  })

  const selectedCustomerId = useWatch({ control, name: 'customer_id' })
  const selectedVehicleId = useWatch({ control, name: 'vehicle_id' })
  const lineItems = useWatch({ control, name: 'line_items' }) || []
  const overallDiscType = useWatch({ control, name: 'overall_discount_type' })
  const overallDiscVal = useWatch({ control, name: 'overall_discount_value' })

  // Auto-populate customer when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId && vehicles) {
      const vehicle = vehicles.find((v) => v.id === selectedVehicleId)
      if (vehicle?.customer_id && vehicle.customer_id !== selectedCustomerId) {
        setValue('customer_id', vehicle.customer_id)
      }
    }
  }, [selectedVehicleId, vehicles, setValue, selectedCustomerId])

  const filteredVehicles = selectedCustomerId
    ? vehicles?.filter((v) => v.customer_id === selectedCustomerId) ?? []
    : vehicles ?? []

  const calculations = useMemo(() => {
    const perItem = lineItems.map((item) => {
      const qty = Number(item?.quantity) || 0
      const price = Number(item?.unit_price) || 0
      const discType = item?.discount_type || ''
      const discVal = Number(item?.discount_value) || 0
      const gross = computeGross(qty, price)
      const net = computeNet(gross, discType, discVal)
      return { ...item, gross, net }
    })

    const categoryTotalsMap: Record<string, number> = {}
    perItem.forEach((item) => {
      const cat = item.category
      categoryTotalsMap[cat] = (categoryTotalsMap[cat] || 0) + item.net
    })
    const categoryTotals = Object.entries(categoryTotalsMap)
      .filter(([_, total]) => total > 0)
      .map(([category, total]) => ({ category, total }))

    const grandSubtotal = perItem.reduce((sum, item) => sum + item.net, 0)

    const ovDiscType = overallDiscType || ''
    const ovDiscVal = Number(overallDiscVal) || 0
    const overallDiscount = ovDiscType === 'amount'
      ? ovDiscVal
      : ovDiscType === 'percent'
        ? grandSubtotal * ovDiscVal / 100
        : 0

    const totalNetAmount = Math.max(0, grandSubtotal - overallDiscount)
    const paid = Number(paidAmount) || 0
    const balance = Math.max(0, totalNetAmount - paid)
    const paymentStatus = paid <= 0 ? 'unpaid'
      : paid < totalNetAmount ? 'partial'
      : paid >= totalNetAmount && paid > 0 ? 'paid'
      : 'overpaid'

    return { perItem, categoryTotals, grandSubtotal, overallDiscount, totalNetAmount, paid, balance, paymentStatus }
  }, [lineItems, overallDiscType, overallDiscVal, paidAmount])

  const addLineItem = useCallback(() => {
    append({
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
      sort_order: fields.length,
    })
  }, [append, fields.length])

  async function onSubmit(data: JobFormValues) {
    const headerPayload = {
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id || null,
      status: data.status as JobStatus,
      date: data.date,
      prepared_by: data.prepared_by || null,
      odometer: data.odometer ?? null,
      currency: data.currency as CurrencyCode,
      notes: data.notes || null,
      terms: data.terms || null,
    }

    const lineItemsPayload = data.line_items.map((li) => ({
      id: li.id,
      category: li.category,
      item: li.item,
      specification: li.specification || null,
      part_number: null,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      installation_status: li.installation_status || null,
      notes: li.notes || null,
      sort_order: li.sort_order,
    }))

    try {
      if (isEditing && defaultValues?.id) {
        await updateJob.mutateAsync({ id: defaultValues.id, data: headerPayload })
        await syncLineItems(defaultValues.id, lineItemsPayload)
      } else {
        const newJob = await createJob.mutateAsync(headerPayload)
        if (lineItemsPayload.length > 0) {
          await syncLineItems(newJob.id, lineItemsPayload)
        }
      }
      onSuccess?.()
    } catch {
      // Error handled by mutation toasts
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header section - preserved unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(value) => {
                  setValue('customer_id', value)
                  setValue('vehicle_id', '')
                }}
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
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">Vehicle *</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={(value) => setValue('vehicle_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.plate || vehicle.vin || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && (
                <p className="text-sm text-red-500">{errors.vehicle_id.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => setValue('status', value as JobFormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prepared_by">Prepared By</Label>
              <Input id="prepared_by" {...register('prepared_by')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input id="odometer" type="number" {...register('odometer')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.watch('currency')}
              onValueChange={(value) => setValue('currency', value as JobFormValues['currency'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button type="button" size="sm" onClick={addLineItem}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-12" />
                  <TableHead className="w-28">Category</TableHead>
                  <TableHead className="min-w-36">Item</TableHead>
                  <TableHead className="min-w-36">Specification</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-16 text-right">Qty</TableHead>
                  <TableHead className="w-16">Unit</TableHead>
                  <TableHead className="w-24 text-right">Unit Price</TableHead>
                  <TableHead className="w-24 text-right">Gross</TableHead>
                  <TableHead className="w-20">Disc Type</TableHead>
                  <TableHead className="w-20 text-right">Discount</TableHead>
                  <TableHead className="w-24 text-right">Net</TableHead>
                  <TableHead className="min-w-32">Remarks</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="h-24 text-center text-muted-foreground">
                      No line items. Click &quot;Add Item&quot; to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => {
                    const qty = Number(form.watch(`line_items.${index}.quantity`)) || 0
                    const price = Number(form.watch(`line_items.${index}.unit_price`)) || 0
                    const discType = form.watch(`line_items.${index}.discount_type`) || ''
                    const discVal = Number(form.watch(`line_items.${index}.discount_value`)) || 0
                    const gross = computeGross(qty, price)
                    const net = computeNet(gross, discType, discVal)
                    const instStatus = form.watch(`line_items.${index}.installation_status`) || ''
                    const instStyle = INSTALLATION_STYLE[instStatus] || ''

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="text-xs text-muted-foreground text-center font-mono">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={form.watch(`line_items.${index}.category`)}
                            onValueChange={(value) =>
                              setValue(`line_items.${index}.category`, value as LineItemCategory)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
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
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            {...register(`line_items.${index}.item`)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            {...register(`line_items.${index}.specification`)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={instStatus}
                            onValueChange={(value) =>
                              setValue(`line_items.${index}.installation_status`, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue>
                                {instStatus ? (
                                  <span className={`inline-block rounded border px-1.5 py-0.5 text-xs ${instStyle}`}>
                                    {INSTALLATION_STATUSES.find((s) => s.value === instStatus)?.label || instStatus}
                                  </span>
                                ) : (
                                  'Select'
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {INSTALLATION_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  <span className={`inline-block rounded border px-1.5 py-0.5 text-xs ${INSTALLATION_STYLE[s.value]}`}>
                                    {s.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            step="any"
                            min="0"
                            {...register(`line_items.${index}.quantity`)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={form.watch(`line_items.${index}.unit`)}
                            onValueChange={(value) =>
                              setValue(`line_items.${index}.unit`, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            step="any"
                            min="0"
                            {...register(`line_items.${index}.unit_price`)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(gross, form.watch('currency'))}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={discType}
                            onValueChange={(value) =>
                              setValue(`line_items.${index}.discount_type`, value)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-20">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                              <SelectItem value="percent">%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs text-right"
                            type="number"
                            step="any"
                            min="0"
                            {...register(`line_items.${index}.discount_value`)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatCurrency(net, form.watch('currency'))}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            {...register(`line_items.${index}.notes`)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === 0}
                              onClick={() => swap(index, index - 1)}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === fields.length - 1}
                              onClick={() => swap(index, index + 1)}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Job Summary Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Job Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Totals */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Category Totals</h4>
              <div className="space-y-1">
                {calculations.categoryTotals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items</p>
                ) : (
                  calculations.categoryTotals.map((ct) => {
                    const catLabel = LINE_ITEM_CATEGORIES.find((c) => c.value === ct.category)?.label || ct.category
                    return (
                      <div key={ct.category} className="flex justify-between text-sm">
                        <span>{catLabel}</span>
                        <span className="font-mono">{formatCurrency(ct.total, form.watch('currency'))}</span>
                      </div>
                    )
                  })
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Grand Subtotal</span>
                <span className="font-mono">{formatCurrency(calculations.grandSubtotal, form.watch('currency'))}</span>
              </div>
            </div>

            {/* Overall Discount and Totals */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Overall Discount</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={overallDiscType}
                      onValueChange={(value) => setValue('overall_discount_type', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      className="h-8 text-xs text-right"
                      type="number"
                      step="any"
                      min="0"
                      {...register('overall_discount_value')}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Total Net Amount</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(calculations.totalNetAmount, form.watch('currency'))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-mono">{formatCurrency(calculations.paid, form.watch('currency'))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Balance</span>
                  <span className="font-mono">{formatCurrency(calculations.balance, form.watch('currency'))}</span>
                </div>
                <div className="flex justify-between text-sm items-center pt-1">
                  <span>Payment Status</span>
                  <Badge
                    variant="outline"
                    className={
                      calculations.paymentStatus === 'unpaid' ? 'text-red-600 bg-red-50 border-red-200' :
                      calculations.paymentStatus === 'partial' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                      calculations.paymentStatus === 'paid' ? 'text-green-600 bg-green-50 border-green-200' :
                      'text-blue-600 bg-blue-50 border-blue-200'
                    }
                  >
                    {calculations.paymentStatus === 'unpaid' ? 'Unpaid' :
                     calculations.paymentStatus === 'partial' ? 'Partial' :
                     calculations.paymentStatus === 'paid' ? 'Paid' :
                     'Overpaid'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms - preserved unchanged */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms</Label>
          <Textarea id="terms" {...register('terms')} />
        </div>
      </div>

      {/* Submit Buttons */}
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
