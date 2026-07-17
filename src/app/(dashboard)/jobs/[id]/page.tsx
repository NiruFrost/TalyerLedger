'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Copy, FileText } from 'lucide-react'
import { useWorkOrder, useCopyWorkOrder } from '@/features/work-orders/hooks/use-work-orders'
import { useUpdateWorkOrder } from '@/features/work-orders/hooks/use-work-orders'
import { useShopSettings } from '@/features/settings/hooks/use-settings'
import { WorkOrderStatusBadge } from '@/features/work-orders/components/work-order-status-badge'
import { LineItemTable } from '@/features/line-items/components/line-item-table'
import { PaymentList } from '@/features/payments/components/payment-list'

import { Skeleton } from '@/components/ui/skeleton'

const DownloadPdfButton = dynamic(
  () => import('@/components/pdf/download-pdf-button'),
  { ssr: false }
)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { WorkOrderStatus } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { JOB_STATUSES } from '@/lib/constants'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: workOrder, isLoading, error } = useWorkOrder(id)
  const updateWorkOrder = useUpdateWorkOrder()
  const copyWorkOrder = useCopyWorkOrder()
  const { data: shopSettings } = useShopSettings()

  if (isLoading) {
    return <WorkOrderDetailSkeleton />
  }

  if (error || !workOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load work order.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/jobs')}>
          Back to Work Orders
        </Button>
      </div>
    )
  }

  async function handleStatusChange(status: string) {
    await updateWorkOrder.mutateAsync({ id, data: { status: status as WorkOrderStatus } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{workOrder.estimate_no}</h1>
              <WorkOrderStatusBadge status={workOrder.status} />
            </div>
            <p className="text-muted-foreground">{formatDate(workOrder.date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={workOrder.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const wo = await copyWorkOrder.mutateAsync(id)
                router.push(`/jobs/${wo.id}`)
              } catch {
              }
            }}
            disabled={copyWorkOrder.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copyWorkOrder.isPending ? 'Copying...' : 'Make a Copy'}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/jobs/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <DownloadPdfButton job={workOrder} shopSettings={shopSettings} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Work Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(workOrder.date)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prepared By</span>
              <span>{workOrder.prepared_by || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency</span>
              <span>{workOrder.currency}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Odometer</span>
              <span>{workOrder.odometer ? `${workOrder.odometer.toLocaleString()} km` : '-'}</span>
            </div>
            {workOrder.payer_type && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payer Type</span>
                  <span className="capitalize">{workOrder.payer_type}</span>
                </div>
              </>
            )}
            {(workOrder.payer_type === 'insurance' || workOrder.payer_type === 'both') && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance</span>
                  <span>{workOrder.insurance_company || '-'}</span>
                </div>
                {workOrder.insurance_policy_no && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Policy No.</span>
                      <span>{workOrder.insurance_policy_no}</span>
                    </div>
                  </>
                )}
                {workOrder.insurance_claim_no && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claim No.</span>
                      <span>{workOrder.insurance_claim_no}</span>
                    </div>
                  </>
                )}
              </>
            )}
            {workOrder.linked_work_order_id && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Work Order</span>
                  <Link href={`/jobs/${workOrder.linked_work_order_id}`} className="hover:underline text-blue-600">
                    {workOrder.linked_work_order?.estimate_no || workOrder.linked_work_order_id}
                  </Link>
                </div>
              </>
            )}
            {workOrder.notes && (
              <>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Notes</span>
                  <span>{workOrder.notes}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer & Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              {workOrder.customer ? (
                <Link href={`/customers/${workOrder.customer.id}`} className="hover:underline">
                  {workOrder.customer.name}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              {workOrder.vehicle ? (
                <Link href={`/vehicles/${workOrder.vehicle.id}`} className="hover:underline">
                  {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            {workOrder.vehicle && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate</span>
                  <span>{workOrder.vehicle.plate || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-mono text-xs">{workOrder.vehicle.vin || '-'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="line-items">
        <TabsList>
          <TabsTrigger value="line-items">Line Items</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
          <TabsContent value="line-items" className="space-y-4">
          <LineItemTable workOrderId={id} currency={workOrder.currency} />
        </TabsContent>
        <TabsContent value="photos">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2" />
              <p>Photo management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <PaymentList workOrderId={id} currency={workOrder.currency} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WorkOrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
