'use client'

import { useMemo } from 'react'
import { ImageIcon } from 'lucide-react'
import { useAttachmentsByCategory } from '../hooks/use-attachments'
import { AttachmentGallery } from './attachment-gallery'
import { BeforeAfterComparison } from './before-after-comparison'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttachmentCategory } from '@/lib/types'

interface JobGalleryProps {
  workOrderId: string
}

const JOB_SECTIONS: AttachmentCategory[] = ['before', 'during', 'after', 'damage', 'odometer', 'other']

export function JobGallery({ workOrderId }: JobGalleryProps) {
  const { data: grouped } = useAttachmentsByCategory('work_order', workOrderId)

  const sections = useMemo(() => {
    if (!grouped) return []
    return JOB_SECTIONS.filter((s) => (grouped[s]?.length ?? 0) > 0)
  }, [grouped])

  const hasBeforeAfter = useMemo(() => {
    if (!grouped) return false
    return (grouped['before']?.length ?? 0) > 0 && (grouped['after']?.length ?? 0) > 0
  }, [grouped])

  return (
    <div className="space-y-6">
      {hasBeforeAfter && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Before & After</CardTitle></CardHeader>
          <CardContent>
            <BeforeAfterComparison
              beforeAttachments={grouped?.['before'] ?? []}
              afterAttachments={grouped?.['after'] ?? []}
            />
          </CardContent>
        </Card>
      )}

      {sections.length === 0 && (!grouped || Object.keys(grouped).length === 0) ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No photos yet</h3>
          <p className="text-sm text-muted-foreground">Upload work order photos to document the repair process.</p>
        </div>
      ) : (
        JOB_SECTIONS.map((section) => {
          const cat = ATTACHMENT_CATEGORIES.find((c) => c.value === section)
          const sectionAttachments = grouped?.[section]
          if (!sectionAttachments || sectionAttachments.length === 0) return null
          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {cat && <span className={`rounded px-1.5 py-0.5 text-[10px] ${cat.color}`}>{cat.label}</span>}
                  <span className="text-muted-foreground font-normal">({sectionAttachments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentGallery
                  parentType="work_order"
                  parentId={workOrderId}
                  filterCategory={section}
                />
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
