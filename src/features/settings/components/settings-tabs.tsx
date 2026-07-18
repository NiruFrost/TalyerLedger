'use client'

import { useState } from 'react'
import { Package, Wrench } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LaborCatalogList } from '@/features/labor-catalog/components/labor-catalog-list'
import { PackageList } from '@/features/service-packages/components/package-list'

export function SettingsTabs() {
  const [tab, setTab] = useState('labor-catalog')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="labor-catalog">
          <Wrench className="mr-1 h-4 w-4" /> Labor Catalog
        </TabsTrigger>
        <TabsTrigger value="service-packages">
          <Package className="mr-1 h-4 w-4" /> Service Packages
        </TabsTrigger>
      </TabsList>
      <TabsContent value="labor-catalog">
        <LaborCatalogList />
      </TabsContent>
      <TabsContent value="service-packages">
        <PackageList />
      </TabsContent>
    </Tabs>
  )
}
