'use client'

import { useState } from 'react'
import { useLaborItems } from '../hooks/use-labor-items'
import { LINE_ITEM_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { LaborItem } from '@/lib/types'

interface LaborItemPickerProps {
  onSelect: (item: LaborItem) => void
}

export function LaborItemPicker({ onSelect }: LaborItemPickerProps) {
  const { data: items } = useLaborItems()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const catalog = items ?? []
  const filtered = search ? catalog.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())) : catalog

  function handleSelect(item: LaborItem) {
    onSelect(item)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">From Catalog</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Select Labor Item</DialogTitle></DialogHeader>
        <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>
          ) : (
            filtered.map((item) => {
              const catLabel = LINE_ITEM_CATEGORIES.find((c) => c.value === item.category)?.label || item.category
              return (
                <button key={item.id} type="button" className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors" onClick={() => handleSelect(item)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{catLabel}</span>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(item.unit_price)}</span>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
