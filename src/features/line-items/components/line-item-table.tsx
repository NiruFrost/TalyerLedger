'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { useLineItems, useDeleteLineItem } from '../hooks/use-line-items'
import { CategoryTotals } from './category-totals'
import { LineItemForm } from './line-item-form'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { LineItem } from '@/lib/types'

interface LineItemTableProps {
  workOrderId: string
  currency?: string
}

export function LineItemTable({ workOrderId, currency = 'PHP' }: LineItemTableProps) {
  const { data: lineItems, isLoading, error } = useLineItems(workOrderId)
  const deleteLineItem = useDeleteLineItem()
  const [editingItem, setEditingItem] = useState<LineItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  if (isLoading) {
    return <LineItemTableSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load line items. Please try again.
      </div>
    )
  }

  const items = lineItems ?? []

  const groupedItems = LINE_ITEM_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.value),
  })).filter((g) => g.items.length > 0)

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteLineItem.mutateAsync({ id: deleteId, workOrderId })
    } finally {
      setDeleteId(null)
    }
  }

  const grandTotal = items.reduce((sum, item) => sum + item.line_total, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Line Items</h3>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No line items yet. Add your first item.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Part #</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems.flatMap((group) => [
                ...group.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {group.label}
                    </TableCell>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell className="text-xs">
                      {item.part_number || '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.unit_price, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(item.line_total, currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )),
                <TableRow key={`${group.value}-total`} className="bg-muted/50">
                  <TableCell colSpan={7} className="text-right text-sm font-medium">
                    {group.label} Total
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(
                      group.items.reduce((sum, i) => sum + i.line_total, 0),
                      currency
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>,
              ])}
              <TableRow key="grand-total" className="font-semibold">
                <TableCell colSpan={7} className="text-right">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(grandTotal, currency)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryTotals lineItems={items} currency={currency} />

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
          </DialogHeader>
          <LineItemForm
            workOrderId={workOrderId}
            onSuccess={() => setShowAddForm(false)}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <LineItemForm
              workOrderId={workOrderId}
              defaultValues={editingItem}
              onSuccess={() => setEditingItem(null)}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this line item and cannot be undone.
            </AlertDialogDescription>
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

function LineItemTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
