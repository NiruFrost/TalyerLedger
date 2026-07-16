'use client'

import Link from 'next/link'
import { Car, Wrench, Users, FileText, UserPlus } from 'lucide-react'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import { useJobs } from '@/features/jobs/hooks/use-jobs'
import { JobStatusBadge } from '@/features/jobs/components/job-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency, calculateJobTotal } from '@/lib/utils'

export default function DashboardPage() {
  const { customers, isLoading: loadingCustomers } = useCustomers()
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles()
  const { data: jobs, isLoading: loadingJobs } = useJobs()

  const isLoading = loadingCustomers || loadingVehicles || loadingJobs

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const totalVehicles = vehicles?.length ?? 0
  const activeJobs = jobs?.filter((j) => !['paid', 'closed'].includes(j.status)).length ?? 0
  const totalCustomers = customers.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to TalyerLedger</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {!jobs || jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.slice(0, 5).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link href={`/jobs/${job.id}`} className="hover:underline font-medium">
                          {job.estimate_no}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>{formatDate(job.date)}</TableCell>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/jobs/new">
                <FileText className="mr-2 h-4 w-4" /> Create Estimate
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/vehicles/new">
                <Car className="mr-2 h-4 w-4" /> Add Vehicle
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/customers/new">
                <UserPlus className="mr-2 h-4 w-4" /> Add Customer
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
