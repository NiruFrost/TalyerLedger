'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { JobTable } from '@/features/jobs/components/job-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function JobsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estimates & Jobs</h1>
          <p className="text-muted-foreground">Manage estimates and job orders</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" /> New Estimate
          </Link>
        </Button>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="estimate">Estimates</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
          <TabsTrigger value="partially_paid">Partial</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="voided">Voided</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          <JobTable filter={filter} onEdit={(id) => router.push(`/jobs/${id}/edit`)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
