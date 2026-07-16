'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Copy, FileText } from 'lucide-react'
import { useJob, useCopyJob } from '@/features/jobs/hooks/use-jobs'
import { useUpdateJob } from '@/features/jobs/hooks/use-jobs'
import { useShopSettings } from '@/features/settings/hooks/use-settings'
import { JobStatusBadge } from '@/features/jobs/components/job-status-badge'
import { LineItemTable } from '@/features/line-items/components/line-item-table'

import { Skeleton } from '@/components/ui/skeleton'

const DownloadPdfButton = dynamic(
  () => import('@/components/pdf/download-pdf-button'),
  { ssr: false }
)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { JobStatus } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { JOB_STATUSES } from '@/lib/constants'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: job, isLoading, error } = useJob(id)
  const updateJob = useUpdateJob()
  const copyJob = useCopyJob()
  const { data: shopSettings } = useShopSettings()

  if (isLoading) {
    return <JobDetailSkeleton />
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load job.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/jobs')}>
          Back to Jobs
        </Button>
      </div>
    )
  }

  async function handleStatusChange(status: string) {
    await updateJob.mutateAsync({ id, data: { status: status as JobStatus } })
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
              <h1 className="text-2xl font-bold tracking-tight">{job.estimate_no}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-muted-foreground">{formatDate(job.date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={job.status} onValueChange={handleStatusChange}>
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
                const newJob = await copyJob.mutateAsync(id)
                router.push(`/jobs/${newJob.id}`)
              } catch {
                // error toast handled by mutation
              }
            }}
            disabled={copyJob.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copyJob.isPending ? 'Copying...' : 'Make a Copy'}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/jobs/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <DownloadPdfButton job={job} shopSettings={shopSettings} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(job.date)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prepared By</span>
              <span>{job.prepared_by || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency</span>
              <span>{job.currency}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Odometer</span>
              <span>{job.odometer ? `${job.odometer.toLocaleString()} km` : '-'}</span>
            </div>
            {job.notes && (
              <>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Notes</span>
                  <span>{job.notes}</span>
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
              {job.customer ? (
                <Link href={`/customers/${job.customer.id}`} className="hover:underline">
                  {job.customer.name}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              {job.vehicle ? (
                <Link href={`/vehicles/${job.vehicle.id}`} className="hover:underline">
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            {job.vehicle && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate</span>
                  <span>{job.vehicle.plate || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-mono text-xs">{job.vehicle.vin || '-'}</span>
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
          <LineItemTable jobId={id} currency={job.currency} />
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
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2" />
              <p>Payment tracking coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobDetailSkeleton() {
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
