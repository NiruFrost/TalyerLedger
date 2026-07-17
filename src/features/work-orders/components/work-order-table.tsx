'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, FileText } from 'lucide-react'
import { useWorkOrders, useDeleteWorkOrder } from '../hooks/use-work-orders'
import { WorkOrderStatusBadge } from './work-order-status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate, calculateJobTotal } from '@/lib/utils'

interface WorkOrderTableProps {
  filter?: string
  onEdit?: (id: string) => void
}

export function WorkOrderTable({ filter = 'all', onEdit }: WorkOrderTableProps) {
  const { data: workOrders, isLoading, error } = useWorkOrders()
  const deleteWorkOrder = useDeleteWorkOrder()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return <WorkOrderTableSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load work orders. Please try again.
      </div>
    )
  }

  const items = workOrders ?? []
  const filtered = filter === 'all' ? items : items.filter((wo) => wo.status === filter)

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No work orders yet</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating a new estimate.
        </p>
      </div>
    )
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteWorkOrder.mutateAsync(deleteId)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estimate #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((wo) => (
            <TableRow key={wo.id}>
              <TableCell className="font-medium">
                <Link href={`/jobs/${wo.id}`} className="hover:underline">
                  {wo.estimate_no}
                </Link>
              </TableCell>
              <TableCell>{formatDate(wo.date)}</TableCell>
              <TableCell>
                {wo.customer ? (
                  <Link href={`/customers/${wo.customer.id}`} className="hover:underline">
                    {wo.customer.name}
                  </Link>
                ) : '-'}
              </TableCell>
              <TableCell>
                {wo.vehicle ? (
                  <span className="text-sm text-muted-foreground">
                    {wo.vehicle.make} {wo.vehicle.model}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <WorkOrderStatusBadge status={wo.status} />
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(
                  wo.line_items ? calculateJobTotal(wo.line_items) : 0,
                  wo.currency
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/jobs/${wo.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(wo.id)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteId(wo.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move this work order to trash. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function WorkOrderTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
