'use client'

import { useState, useMemo } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { useAttachments } from '../hooks/use-attachments'
import { AttachmentCard } from './attachment-card'
import { AttachmentViewer } from './attachment-viewer'
import { AttachmentUpload } from './attachment-upload'
import { Skeleton } from '@/components/ui/skeleton'
import type { Attachment, AttachmentParentType, AttachmentCategory } from '@/lib/types'

interface AttachmentGalleryProps {
  parentType: AttachmentParentType
  parentId: string
  title?: string
  defaultCategory?: AttachmentCategory
  logDescription?: string
  filterCategory?: AttachmentCategory
}

export function AttachmentGallery({ parentType, parentId, title, defaultCategory, logDescription, filterCategory }: AttachmentGalleryProps) {
  const { data: attachments, isLoading, error } = useAttachments(parentType, parentId)
  const [viewing, setViewing] = useState<Attachment | null>(null)

  const filtered = useMemo(() => {
    if (!attachments) return []
    if (!filterCategory) return attachments
    return attachments.filter((a) => a.attachment_type === filterCategory)
  }, [attachments, filterCategory])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load attachments.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && <h3 className="text-sm font-semibold">{title} ({filtered.length})</h3>}
        <AttachmentUpload
          parentType={parentType}
          parentId={parentId}
          defaultCategory={defaultCategory}
          logDescription={logDescription}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No attachments yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((att) => (
            <AttachmentCard
              key={att.id}
              attachment={att}
              onView={setViewing}
            />
          ))}
        </div>
      )}

      {viewing && (
        <AttachmentViewer
          attachments={filtered}
          initialIndex={filtered.indexOf(viewing)}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
