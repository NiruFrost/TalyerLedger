'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useVehicle } from '@/features/vehicles/hooks/use-vehicles'
import { VehicleForm } from '@/features/vehicles/components/vehicle-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditVehiclePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: vehicle, isLoading, error } = useVehicle(id)

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
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load vehicle.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/vehicles/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Vehicle</h1>
          <p className="text-muted-foreground">Update vehicle information</p>
        </div>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            defaultValues={vehicle}
            onSuccess={() => router.push(`/vehicles/${id}`)}
            onCancel={() => router.push(`/vehicles/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
