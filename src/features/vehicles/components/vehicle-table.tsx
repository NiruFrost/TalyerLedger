'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, Car } from 'lucide-react'
import { useVehicles, useDeleteVehicle } from '../hooks/use-vehicles'
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

interface VehicleTableProps {
  onEdit?: (id: string) => void
}

export function VehicleTable({ onEdit }: VehicleTableProps) {
  const { data: vehicles, isLoading, error } = useVehicles()
  const deleteVehicle = useDeleteVehicle()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return <VehicleTableSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load vehicles. Please try again.
      </div>
    )
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No vehicles yet</h3>
        <p className="text-sm text-muted-foreground">
          Get started by adding your first vehicle.
        </p>
      </div>
    )
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteVehicle.mutateAsync(deleteId)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Jobs</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.make}</TableCell>
              <TableCell>{vehicle.model}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.plate || '-'}</TableCell>
              <TableCell>
                {vehicle.customer ? (
                  <Link
                    href={`/customers/${vehicle.customer.id}`}
                    className="hover:underline"
                  >
                    {vehicle.customer.name}
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>-</TableCell>
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
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(vehicle.id)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteId(vehicle.id)}
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
              This will permanently delete this vehicle and cannot be undone.
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

function VehicleTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
