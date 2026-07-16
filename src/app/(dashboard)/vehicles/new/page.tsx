'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { VehicleForm } from '@/features/vehicles/components/vehicle-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewVehiclePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/vehicles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Vehicle</h1>
          <p className="text-muted-foreground">Create a new vehicle record</p>
        </div>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            defaultValues={customerId ? { customer_id: customerId } : undefined}
            onSuccess={() => router.push('/vehicles')}
            onCancel={() => router.push('/vehicles')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
