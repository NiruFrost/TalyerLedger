'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCustomer } from '@/features/customers/hooks/use-customers'
import { CustomerForm } from '@/features/customers/components/customer-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: customer, isLoading, error } = useCustomer(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="max-w-2xl">
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/customers/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground">Update customer information</p>
        </div>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            defaultValues={customer}
            onSuccess={() => router.push(`/customers/${id}`)}
            onCancel={() => router.push(`/customers/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
