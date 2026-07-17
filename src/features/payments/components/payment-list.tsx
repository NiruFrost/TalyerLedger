'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { usePayments, useDeletePayment } from '../hooks/use-payments'
import { PaymentForm } from './payment-form'
import { PAYMENT_TYPES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { Payment } from '@/lib/types'

interface PaymentListProps {
  workOrderId: string
  currency?: string
}

export function PaymentList({ workOrderId, currency = 'PHP' }: PaymentListProps) {
  const { data: payments, isLoading, error } = usePayments(workOrderId)
  const deletePayment = useDeletePayment()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load payments.
      </div>
    )
  }

  const items = payments ?? []
  const totalPayments = items.reduce((sum, p) => sum + p.amount, 0)

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deletePayment.mutateAsync({ id: deleteId, workOrderId })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Payments
          {items.length > 0 && (
            <span className="text-muted-foreground text-sm ml-2">
              (Total: {formatCurrency(totalPayments, currency)})
            </span>
          )}
        </h3>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Payment
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No payments recorded yet.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {PAYMENT_TYPES.find((pt) => pt.value === payment.payment_type)?.label || payment.payment_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{payment.payment_method.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-xs font-mono">{payment.reference_number || '-'}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(payment.amount, currency)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                    {payment.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingPayment(payment)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => setDeleteId(payment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            workOrderId={workOrderId}
            onSuccess={() => setShowAddForm(false)}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingPayment}
        onOpenChange={(open) => !open && setEditingPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <PaymentForm
              workOrderId={workOrderId}
              defaultValues={editingPayment}
              onSuccess={() => setEditingPayment(null)}
              onCancel={() => setEditingPayment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment and cannot be undone.
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
