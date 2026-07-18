'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { useServicePackages, useDeleteServicePackage } from '../hooks/use-service-packages'
import { PackageForm } from './package-form'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { ServicePackage } from '@/lib/types'

export function PackageList() {
  const { data: packages, isLoading, error } = useServicePackages()
  const deletePackage = useDeleteServicePackage()
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load service packages.</div>
  }

  const data = packages ?? []

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deletePackage.mutateAsync(deleteId)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Service Packages</h3>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Package
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No service packages yet</h3>
          <p className="text-sm text-muted-foreground">Create packages of services for common jobs like oil changes or tune-ups.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((pkg) => {
                const total = pkg.total_price ?? (pkg.items ?? []).reduce((s, i) => s + i.unit_price * i.quantity, 0)
                return (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="capitalize">{pkg.category}</TableCell>
                    <TableCell>{(pkg.items ?? []).length} items</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPackage(pkg)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(pkg.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Service Package</DialogTitle></DialogHeader>
          <PackageForm onSuccess={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPackage} onOpenChange={(o) => !o && setEditingPackage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Package</DialogTitle></DialogHeader>
          {editingPackage && (
            <PackageForm defaultValues={editingPackage} onSuccess={() => setEditingPackage(null)} onCancel={() => setEditingPackage(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this service package.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
