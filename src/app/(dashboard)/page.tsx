'use client'

import Link from 'next/link'
import { Car, Wrench, Users, FileText, UserPlus, DollarSign } from 'lucide-react'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import { useWorkOrders } from '@/features/work-orders/hooks/use-work-orders'
import { WorkOrderStatusBadge } from '@/features/work-orders/components/work-order-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency, calculateJobTotal } from '@/lib/utils'

export default function DashboardPage() {
  const { customers, isLoading: loadingCustomers } = useCustomers()
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles()
  const { data: workOrders, isLoading: loadingJobs } = useWorkOrders()

  const isLoading = loadingCustomers || loadingVehicles || loadingJobs

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const totalVehicles = vehicles?.length ?? 0
  const activeWorkOrders = workOrders?.filter((wo) => !['paid', 'closed', 'voided'].includes(wo.status)).length ?? 0
  const totalCustomers = customers.length

  const outstandingWorkOrders = workOrders?.filter(
    (wo) => !['paid', 'closed', 'draft', 'voided'].includes(wo.status)
  ) ?? []

  const revenueWorkOrders = workOrders?.filter(
    (wo) => ['paid', 'invoiced'].includes(wo.status)
  ) ?? []
  const totalRevenue = revenueWorkOrders.reduce(
    (sum, wo) => sum + (wo.line_items ? calculateJobTotal(wo.line_items) : 0), 0
  )

  const recentVehicles = vehicles?.slice(0, 5) ?? []
  const recentWorkOrders = workOrders?.filter((wo) => wo.status !== 'voided').slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to TalyerLedger</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <div className="text-2xl font-bold">{activeWorkOrders}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Invoiced & Paid work orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No work orders yet.</p>
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
                  {recentWorkOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell>
                        <Link href={`/jobs/${wo.id}`} className="hover:underline font-medium">
                          {wo.estimate_no}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <WorkOrderStatusBadge status={wo.status} />
                      </TableCell>
                      <TableCell>{formatDate(wo.date)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(
                          wo.line_items ? calculateJobTotal(wo.line_items) : 0,
                          wo.currency
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentVehicles.map((v) => (
                    <Link
                      key={v.id}
                      href={`/vehicles/${v.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{v.make} {v.model}</p>
                        <p className="text-xs text-muted-foreground">{v.plate || v.vin || 'No plate'}</p>
                      </div>
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
            <CardTitle>Outstanding Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {outstandingWorkOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding work orders.</p>
            ) : (
              <div className="space-y-3">
                {outstandingWorkOrders.slice(0, 5).map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/jobs/${wo.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{wo.estimate_no}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(wo.date)}</p>
                    </div>
                    <WorkOrderStatusBadge status={wo.status} />
                  </Link>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/jobs/new">
              <FileText className="mr-2 h-4 w-4" /> Create Estimate
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vehicles/new">
              <Car className="mr-2 h-4 w-4" /> Add Vehicle
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/customers/new">
              <UserPlus className="mr-2 h-4 w-4" /> Add Customer
            </Link>
          </Button>
        </CardContent>
      </Card>
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
