'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Plus, Wrench } from 'lucide-react'
import { useVehicle } from '@/features/vehicles/hooks/use-vehicles'
import { useJobsByVehicle } from '@/features/jobs/hooks/use-jobs'
import { JobStatusBadge } from '@/features/jobs/components/job-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency, calculateJobTotal } from '@/lib/utils'

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: vehicle, isLoading, error } = useVehicle(id)
  const { data: jobs, isLoading: loadingJobs } = useJobsByVehicle(id)

  if (isLoading) {
    return <VehicleDetailSkeleton />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/vehicles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-muted-foreground">{vehicle.plate || 'No plate'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/vehicles/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/jobs/new?vehicleId=${id}`}>
              <Plus className="mr-2 h-4 w-4" /> New Estimate
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Make</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.make}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.model}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.plate || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">VIN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium font-mono text-xs">{vehicle.vin || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.engine || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transmission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.transmission || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Color</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{vehicle.color || '-'}</p>
          </CardContent>
        </Card>
        {vehicle.cover_photo && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm">Cover Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={vehicle.cover_photo}
                alt={`${vehicle.make} ${vehicle.model}`}
                width={800}
                height={300}
                className="max-h-64 w-full rounded-lg object-cover"
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.customer ? (
              <Link href={`/customers/${vehicle.customer.id}`} className="font-medium hover:underline">
                {vehicle.customer.name}
              </Link>
            ) : (
              <p className="font-medium text-muted-foreground">No customer</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Service History</CardTitle>
          <Button asChild size="sm">
            <Link href={`/jobs/new?vehicleId=${id}`}>
              <Plus className="mr-2 h-4 w-4" /> New Estimate
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No service history yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.estimate_no}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(job.date)}</TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(
                        job.line_items ? calculateJobTotal(job.line_items) : 0,
                        job.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function VehicleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-16" /></CardHeader>
            <CardContent><Skeleton className="h-5 w-32" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
