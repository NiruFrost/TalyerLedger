'use client'

import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useJob } from '@/features/jobs/hooks/use-jobs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
)

const InvoicePDF = dynamic(
  () => import('@/components/pdf/invoice-pdf').then((mod) => mod.default),
  { ssr: false }
)

export default function JobPdfPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: job, isLoading, error } = useJob(id)

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

  if (typeof window === 'undefined') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <p className="text-muted-foreground">{job.estimate_no}</p>
          </div>
        </div>
      </div>
      <PDFViewer style={{ width: '100%', height: 'calc(100vh - 12rem)' }}>
        <InvoicePDF job={job} />
      </PDFViewer>
    </div>
  )
}
