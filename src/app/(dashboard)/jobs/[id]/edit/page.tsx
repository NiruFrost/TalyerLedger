'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useJob } from '@/features/jobs/hooks/use-jobs'
import { JobForm } from '@/features/jobs/components/job-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'


export default function EditJobPage() {
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
        <Card className="max-w-2xl">
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/jobs/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Estimate</h1>
          <p className="text-muted-foreground">Update estimate or job details</p>
        </div>
      </div>
      <JobForm
        defaultValues={job}
        onSuccess={() => router.push(`/jobs/${id}`)}
        onCancel={() => router.push(`/jobs/${id}`)}
      />
    </div>
  )
}
