'use client'

import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
import { useWorkOrder } from '@/features/work-orders/hooks/use-work-orders'
import { useShopSettings } from '@/features/settings/hooks/use-settings'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const PdfPreview = dynamic(
  () => import('@/components/pdf/pdf-preview'),
  { ssr: false }
)

export default function JobPdfPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: workOrder, isLoading, error } = useWorkOrder(id)
  const { data: shopSettings } = useShopSettings()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[calc(100vh-12rem)] w-full" />
      </div>
    )
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/jobs/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PDF Preview</h1>
            <p className="text-muted-foreground">{workOrder.estimate_no}</p>
          </div>
        </div>
      </div>
      <PdfPreview job={workOrder} shopSettings={shopSettings} />
    </div>
  )
}
