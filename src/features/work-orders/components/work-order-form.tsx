'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { workOrderFormSchema, type WorkOrderFormValues } from '../schemas'
import {
  useCreateWorkOrderWithItems,
  useUpdateWorkOrderWithItems,
} from '../hooks/use-work-orders'
import { getPaymentsTotal } from '@/features/work-orders/actions'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import { JOB_STATUSES, PAYMENT_STATUSES, STATUS_TRANSITIONS, CURRENCIES, LINE_ITEM_CATEGORIES, INSTALLATION_STATUSES, PAYER_TYPES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { getUserMessage } from '@/lib/errors/app-error'
import { queryKeys } from '@/lib/query/keys'
import {
  calculateWorkOrderFinancials,
} from '@/lib/financial-calculations'
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
import { UnitCombobox } from '@/components/ui/unit-combobox'
import { Separator } from '@/components/ui/separator'
import type { WorkOrder, WorkOrderStatus, CurrencyCode, LineItemCategory, DiscountType, PayerType, LaborItem, ServicePackage } from '@/lib/types'
import { LaborItemPicker } from '@/features/labor-catalog/components/labor-item-picker'
import { PackagePicker } from '@/features/service-packages/components/package-picker'

interface WorkOrderFormProps {
  defaultValues?: Partial<WorkOrder>
  onSuccess?: () => void
  onCancel?: () => void
}

const INSTALLATION_STYLE: Record<string, string> = {
  to_confirm: 'bg-amber-100 text-amber-800 border-amber-300',
  ordered: 'bg-violet-100 text-violet-800 border-violet-300',
  in_stock: 'bg-blue-100 text-blue-800 border-blue-300',
  installed: 'bg-green-100 text-green-800 border-green-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  na: 'bg-gray-100 text-gray-800 border-gray-300',
}

export function WorkOrderForm({ defaultValues, onSuccess, onCancel }: WorkOrderFormProps) {
  const createWorkOrder = useCreateWorkOrderWithItems()
  const updateWorkOrder = useUpdateWorkOrderWithItems()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { customers } = useCustomers()
  const { data: vehicles } = useVehicles()
  const isEditing = !!defaultValues?.id

  const { data: paidAmount = 0 } = useQuery({
    queryKey: queryKeys.workOrders.paymentsTotal(defaultValues?.id),
    queryFn: () => getPaymentsTotal(defaultValues!.id!),
    enabled: !!defaultValues?.id,
  })

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: defaultValues
      ? {
          vehicle_id: defaultValues.vehicle_id || '',
          customer_id: defaultValues.customer_id || '',
          status: defaultValues.status || 'draft',
          payer_type: defaultValues.payer_type || '',
          insurance_company: defaultValues.insurance_company || '',
          insurance_policy_no: defaultValues.insurance_policy_no || '',
          insurance_claim_no: defaultValues.insurance_claim_no || '',
          linked_work_order_id: defaultValues.linked_work_order_id || '',
          date: (defaultValues.date || new Date().toISOString()).split('T')[0],
          prepared_by: defaultValues.prepared_by || '',
          odometer: defaultValues.odometer ?? undefined,
          currency: defaultValues.currency || 'PHP',
          overall_discount_type: defaultValues.overall_discount_type || '',
          overall_discount_value: defaultValues.overall_discount_value || 0,
          notes: defaultValues.notes || '',
          internal_notes: defaultValues.internal_notes || '',
          terms: defaultValues.terms || '',
          line_items: (defaultValues.line_items || []).map((li, i) => ({
            id: li.id,
            category: li.category,
            item: li.item,
            specification: li.specification || '',
            part_number: li.part_number || '',
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
          payer_type: '',
          insurance_company: '',
          insurance_policy_no: '',
          insurance_claim_no: '',
          linked_work_order_id: '',
          date: new Date().toISOString().split('T')[0],
          prepared_by: '',
          odometer: undefined,
          currency: 'PHP',
          overall_discount_type: '',
          overall_discount_value: 0,
          notes: '',
          internal_notes: '',
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
  const lineItems = useWatch({ control, name: 'line_items' })
  const overallDiscType = useWatch({ control, name: 'overall_discount_type' })
  const overallDiscVal = useWatch({ control, name: 'overall_discount_value' })
  const currentStatus = useWatch({ control, name: 'status' })
  const selectedCurrency = useWatch({ control, name: 'currency' })
  const payerType = useWatch({ control, name: 'payer_type' })

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
    return calculateWorkOrderFinancials({
      lineItems: (lineItems ?? []).map((item) => ({
        category: item?.category ?? 'other',
        quantity: Number(item?.quantity) || 0,
        unit_price: Number(item?.unit_price) || 0,
        discount_type:
          item?.discount_type === 'amount' || item?.discount_type === 'percent'
            ? item.discount_type
            : null,
        discount_value: Number(item?.discount_value) || 0,
      })),
      overallDiscountType:
        overallDiscType === 'amount' || overallDiscType === 'percent'
          ? overallDiscType
          : null,
      overallDiscountValue: Number(overallDiscVal) || 0,
      paid: Number(paidAmount) || 0,
    })
  }, [lineItems, overallDiscType, overallDiscVal, paidAmount])

  const addLineItem = useCallback(() => {
    append({
      category: 'parts',
      item: '',
      specification: '',
      part_number: '',
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

  async function onSubmit(data: WorkOrderFormValues) {
    setSubmitError(null)
    const headerPayload = {
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id || null,
      status: data.status as WorkOrderStatus,
      payer_type: (data.payer_type || null) as PayerType | null,
      insurance_company: data.insurance_company || null,
      insurance_policy_no: data.insurance_policy_no || null,
      insurance_claim_no: data.insurance_claim_no || null,
      linked_work_order_id: data.linked_work_order_id || null,
      date: data.date,
      prepared_by: data.prepared_by || null,
      odometer: data.odometer ?? null,
      currency: data.currency as CurrencyCode,
      overall_discount_type: (data.overall_discount_type || null) as DiscountType | null,
      overall_discount_value: data.overall_discount_value || 0,
      notes: data.notes || null,
      internal_notes: data.internal_notes || null,
      terms: data.terms || null,
    }

    const lineItemsPayload = data.line_items.map((li) => ({
      id: li.id,
      category: li.category,
      item: li.item,
      specification: li.specification || null,
      part_number: li.part_number || null,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      discount_type: li.discount_type || null,
      discount_value: li.discount_value || 0,
      installation_status: li.installation_status || null,
      notes: li.notes || null,
      sort_order: li.sort_order,
    }))

    try {
      if (isEditing && defaultValues?.id) {
        await updateWorkOrder.mutateAsync({
          id: defaultValues.id,
          expectedVersion: defaultValues.version ?? 1,
          data: headerPayload,
          lineItems: lineItemsPayload,
        })
      } else {
        await createWorkOrder.mutateAsync({ data: headerPayload, lineItems: lineItemsPayload })
      }
      onSuccess?.()
    } catch (error) {
      setSubmitError(getUserMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Work Order Information</CardTitle>
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
                value={currentStatus}
                disabled={!isEditing}
                onValueChange={(value) => setValue('status', value as WorkOrderFormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES
                    .filter((s) => {
                      if (!currentStatus) return true
                      const allowed = STATUS_TRANSITIONS[currentStatus as WorkOrderStatus] ?? []
                      return s.value === currentStatus || allowed.includes(s.value as WorkOrderStatus)
                    })
                    .map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  New work orders start as Draft.
                </p>
              )}
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
              value={selectedCurrency}
              onValueChange={(value) => setValue('currency', value as WorkOrderFormValues['currency'])}
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

          <div className="space-y-2">
            <Label htmlFor="payer_type">Payer Type</Label>
            <Select
              value={payerType}
              onValueChange={(value) => setValue('payer_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {PAYER_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {(payerType === 'insurance' || payerType === 'both') && (
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_company">Insurance Company</Label>
                <Input id="insurance_company" {...register('insurance_company')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_policy_no">Policy No.</Label>
                <Input id="insurance_policy_no" {...register('insurance_policy_no')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance_claim_no">Claim No.</Label>
              <Input id="insurance_claim_no" {...register('insurance_claim_no')} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <div className="flex gap-2">
            <LaborItemPicker onSelect={(item: LaborItem) => {
              append({
                category: item.category,
                item: item.name,
                specification: item.description || '',
                part_number: '',
                installation_status: '',
                quantity: 1,
                unit: item.unit,
                unit_price: item.unit_price,
                discount_type: '',
                discount_value: 0,
                notes: '',
                sort_order: fields.length,
              })
            }} />
            <PackagePicker onSelect={(pkg: ServicePackage) => {
              for (const pkgItem of (pkg.items ?? [])) {
                append({
                  category: pkgItem.item_type,
                  item: pkgItem.name,
                  specification: pkgItem.description || '',
                  part_number: '',
                  installation_status: '',
                  quantity: pkgItem.quantity,
                  unit: pkgItem.unit,
                  unit_price: pkgItem.unit_price,
                  discount_type: '',
                  discount_value: 0,
                  notes: '',
                  sort_order: fields.length,
                })
              }
            }} />
            <Button type="button" size="sm" onClick={addLineItem}>
              <Plus className="mr-1 h-4 w-4" /> Add Item
            </Button>
          </div>
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
                  <TableHead className="w-28">Part #</TableHead>
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
                    <TableCell colSpan={16} className="h-24 text-center text-muted-foreground">
                      No line items. Click &quot;Add Item&quot; to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => {
                    const discType = lineItems?.[index]?.discount_type || ''
                    const { gross, net } = calculations.lines[index] ?? { gross: 0, net: 0 }
                    const instStatus = lineItems?.[index]?.installation_status || ''
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
                            value={lineItems?.[index]?.category}
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
                          <Input
                            className="h-8 text-xs"
                            {...register(`line_items.${index}.part_number`)}
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
                          <UnitCombobox
                            value={lineItems?.[index]?.unit}
                            onChange={(value) => setValue(`line_items.${index}.unit`, value)}
                            className="w-20"
                          />
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
                          {formatCurrency(gross, selectedCurrency)}
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
                          {formatCurrency(net, selectedCurrency)}
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

      <Card>
        <CardHeader>
          <CardTitle>Job Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
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
                        <span className="font-mono">{formatCurrency(ct.total, selectedCurrency)}</span>
                      </div>
                    )
                  })
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Grand Subtotal</span>
                <span className="font-mono">{formatCurrency(calculations.grandSubtotal, selectedCurrency)}</span>
              </div>
            </div>

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
                    {formatCurrency(calculations.totalNet, selectedCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-mono">{formatCurrency(calculations.paid, selectedCurrency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Balance</span>
                  <span className="font-mono">{formatCurrency(calculations.balance, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm items-center pt-1">
                  <span>Payment Status</span>
                  <Badge
                    variant="outline"
                    className={
                      PAYMENT_STATUSES.find((ps) => ps.value === calculations.paymentStatus)?.color || ''
                    }
                  >
                    {PAYMENT_STATUSES.find((ps) => ps.value === calculations.paymentStatus)?.label || calculations.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notes">Customer Notes</Label>
          <Textarea id="notes" {...register('notes')} />
          <p className="text-xs text-muted-foreground">Visible on PDF</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms</Label>
          <Textarea id="terms" {...register('terms')} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea id="internal_notes" {...register('internal_notes')} placeholder="Notes for staff only — never printed on PDF..." />
            <p className="text-xs text-muted-foreground">Internal notes are never shown on PDFs or customer documents.</p>
          </div>
        </CardContent>
      </Card>

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

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
