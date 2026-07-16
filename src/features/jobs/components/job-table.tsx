'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, FileText } from 'lucide-react'
import { useJobs, useDeleteJob } from '../hooks/use-jobs'
import { JobStatusBadge } from './job-status-badge'
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
import { formatDate, formatCurrency, calculateJobTotal } from '@/lib/utils'

interface JobTableProps {
  onEdit?: (id: string) => void
  filter?: string
}

export function JobTable({ onEdit, filter = 'all' }: JobTableProps) {
  const { data: jobs, isLoading, error } = useJobs()
  const deleteJob = useDeleteJob()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return <JobTableSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load jobs. Please try again.
      </div>
    )
  }

  const filtered = filter === 'all' ? jobs : jobs?.filter((j) => j.status === filter)

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No jobs yet</h3>
        <p className="text-sm text-muted-foreground">
          {filter === 'all' ? 'Get started by creating your first estimate.' : `No jobs with status "${filter}".`}
        </p>
      </div>
    )
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteJob.mutateAsync(deleteId)
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
            <TableHead>Vehicle</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((job) => {
            const total = job.line_items
              ? calculateJobTotal(job.line_items)
              : 0

            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">
                    {job.estimate_no}
                  </Link>
                </TableCell>
                <TableCell>
                  {job.vehicle
                    ? `${job.vehicle.make} ${job.vehicle.model}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {job.customer?.name || '-'}
                </TableCell>
                <TableCell>{formatDate(job.date)}</TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(total, job.currency)}
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
                        <Link href={`/jobs/${job.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(job.id)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(job.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job and cannot be undone.
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

function JobTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
