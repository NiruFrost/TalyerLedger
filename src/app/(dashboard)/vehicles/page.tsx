'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { VehicleTable } from '@/features/vehicles/components/vehicle-table'
import { Button } from '@/components/ui/button'

export default function VehiclesPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicles</p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Link>
        </Button>
      </div>
      <VehicleTable onEdit={(id) => router.push(`/vehicles/${id}/edit`)} />
    </div>
  )
}
