'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Plus, Mail, Phone, MapPin, FileText, Car } from 'lucide-react'
import { useCustomer } from '@/features/customers/hooks/use-customers'
import { useVehiclesByCustomer } from '@/features/vehicles/hooks/use-vehicles'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: customer, isLoading, error } = useCustomer(id)
  const { data: vehicles, isLoading: loadingVehicles } = useVehiclesByCustomer(id)

  if (isLoading) {
    return <CustomerDetailSkeleton />
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load customer.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/customers')}>
          Back to Customers
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground">Customer details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/customers/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/vehicles/new?customerId=${id}`}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address || 'No address'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {customer.notes || 'No notes'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicles</CardTitle>
          <Button asChild size="sm">
            <Link href={`/vehicles/new?customerId=${id}`}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingVehicles ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !vehicles || vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No vehicles for this customer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Link href={`/vehicles/${v.id}`} className="font-medium hover:underline">
                      {v.year} {v.make} {v.model}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {v.plate || 'No plate'} {v.vin ? `- ${v.vin}` : ''}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/jobs/new?vehicleId=${v.id}`}>
                      <FileText className="mr-2 h-4 w-4" /> New Estimate
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-16" /></CardHeader>
          <CardContent><Skeleton className="h-12 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  )
}
