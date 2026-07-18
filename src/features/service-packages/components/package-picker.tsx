'use client'

import { useState } from 'react'
import { useServicePackages } from '../hooks/use-service-packages'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { ServicePackage } from '@/lib/types'

interface PackagePickerProps {
  onSelect: (pkg: ServicePackage) => void
}

export function PackagePicker({ onSelect }: PackagePickerProps) {
  const { data: packages } = useServicePackages()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const catalog = packages ?? []
  const filtered = search ? catalog.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : catalog

  function handleSelect(pkg: ServicePackage) {
    onSelect(pkg)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">From Package</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Select Service Package</DialogTitle></DialogHeader>
        <Input placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No packages found.</p>
          ) : (
            filtered.map((pkg) => {
              const total = pkg.total_price ?? (pkg.items ?? []).reduce((s, i) => s + i.unit_price * i.quantity, 0)
              return (
                <button key={pkg.id} type="button" className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors" onClick={() => handleSelect(pkg)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{pkg.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{pkg.category}</span>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(total)}</span>
                  </div>
                  {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
