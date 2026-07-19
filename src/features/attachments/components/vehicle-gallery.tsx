'use client'

import { useMemo } from 'react'
import { ImageIcon } from 'lucide-react'
import { useAttachments } from '../hooks/use-attachments'
import { AttachmentGallery } from './attachment-gallery'
import { BeforeAfterComparison } from './before-after-comparison'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AttachmentCategory } from '@/lib/types'

interface VehicleGalleryProps {
  vehicleId: string
}

export function VehicleGallery({ vehicleId }: VehicleGalleryProps) {
  const { data: attachments } = useAttachments('vehicle', vehicleId)

  const categories = useMemo(() => {
    if (!attachments) return []
    const cats = new Set(attachments.map((a) => a.attachment_type))
    return ATTACHMENT_CATEGORIES.filter((c) => cats.has(c.value as AttachmentCategory))
  }, [attachments])

  const hasBeforeAfter = useMemo(() => {
    if (!attachments) return false
    const types = attachments.map((a) => a.attachment_type)
    return types.includes('before') && types.includes('after')
  }, [attachments])

  return (
    <div className="space-y-6">
      {hasBeforeAfter && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Before & After</CardTitle></CardHeader>
          <CardContent>
            <BeforeAfterComparison
              beforeAttachments={attachments?.filter((a) => a.attachment_type === 'before') ?? []}
              afterAttachments={attachments?.filter((a) => a.attachment_type === 'after') ?? []}
            />
          </CardContent>
        </Card>
      )}

      {categories.length > 1 ? (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All ({attachments?.length ?? 0})</TabsTrigger>
            {ATTACHMENT_CATEGORIES.filter((c) => categories.find((cat) => cat.value === c.value)).map((cat) => {
              const count = attachments?.filter((a) => a.attachment_type === cat.value).length ?? 0
              return count > 0 ? (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label} ({count})
                </TabsTrigger>
              ) : null
            })}
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <AttachmentGallery parentType="vehicle" parentId={vehicleId} />
          </TabsContent>
          {ATTACHMENT_CATEGORIES.filter((c) => categories.find((cat) => cat.value === c.value)).map((cat) => {
            const count = attachments?.filter((a) => a.attachment_type === cat.value).length ?? 0
            return count > 0 ? (
              <TabsContent key={cat.value} value={cat.value} className="mt-4">
                <AttachmentGallery parentType="vehicle" parentId={vehicleId} filterCategory={cat.value as AttachmentCategory} />
              </TabsContent>
            ) : null
          })}
        </Tabs>
      ) : (
        <AttachmentGallery parentType="vehicle" parentId={vehicleId} />
      )}

      {(!attachments || attachments.length === 0) && (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No photos yet</h3>
          <p className="text-sm text-muted-foreground">Upload vehicle photos to build a visual history.</p>
        </div>
      )}
    </div>
  )
}
