'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { JobForm } from '@/features/jobs/components/job-form'
import { Button } from '@/components/ui/button'

export default function NewJobPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/jobs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Estimate</h1>
          <p className="text-muted-foreground">Create a new estimate or job order</p>
        </div>
      </div>
      <JobForm
        defaultValues={vehicleId ? { vehicle_id: vehicleId } : undefined}
        onSuccess={() => router.push('/jobs')}
        onCancel={() => router.push('/jobs')}
      />
    </div>
  )
}
