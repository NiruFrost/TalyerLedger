'use client'
/* eslint-disable @next/next/no-img-element -- Private attachment URLs are signed and expire, so they cannot be safely routed through the Next.js image optimizer. */

import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Download } from 'lucide-react'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import { storageService } from '@/lib/storage/service'
import { useDeleteAttachment } from '../hooks/use-attachments'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { Attachment } from '@/lib/types'

interface AttachmentCardProps {
  attachment: Attachment
  onView?: (attachment: Attachment) => void
  onDeleted?: () => void
}

export function AttachmentCard({ attachment, onView, onDeleted }: AttachmentCardProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useDeleteAttachment()
  const [loadError, setLoadError] = useState(false)

  const category = ATTACHMENT_CATEGORIES.find((c) => c.value === attachment.attachment_type)
  const categoryColor = category?.color || 'bg-gray-100 text-gray-700'

  useState(() => {
    if (attachment.thumbnail_path) {
      storageService.getSignedUrl(attachment.thumbnail_path, 3600).then(setImgSrc).catch(() => setLoadError(true))
    } else if (attachment.storage_path) {
      storageService.getSignedUrl(attachment.storage_path, 3600).then(setImgSrc).catch(() => setLoadError(true))
    }
  })

  async function handleDownload() {
    if (!attachment.storage_path) return
    const url = await storageService.getSignedUrl(attachment.storage_path, 86400)
    window.open(url, '_blank')
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync({
        id: deleteId,
        storagePath: attachment.storage_path,
        parentType: attachment.parent_type,
        parentId: attachment.parent_id,
      })
    } finally {
      setDeleteId(null)
      onDeleted?.()
    }
  }

  const attachmentImage = imgSrc && !loadError ? (
    <img
      src={imgSrc}
      alt={attachment.caption || 'Attachment'}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : null

  return (
    <>
      <Card className="group relative overflow-hidden">
        <div className="aspect-square relative bg-muted">
          {attachmentImage ? (
            onView ? (
              <button
                type="button"
                className="block h-full w-full cursor-pointer p-0"
                onClick={() => onView(attachment)}
                aria-label={`View ${attachment.caption || 'attachment'}`}
              >
                {attachmentImage}
              </button>
            ) : (
              attachmentImage
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm p-2 text-center">
              {loadError ? 'Load failed' : 'Loading...'}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryColor}`}>
              {category?.label || attachment.attachment_type}
            </span>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-1">
            <Button type="button" variant="secondary" size="icon" className="h-7 w-7" onClick={handleDownload} aria-label={`Download ${attachment.caption || 'attachment'}`}>
              <Download className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(attachment.id)} aria-label={`Delete ${attachment.caption || 'attachment'}`}>
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="p-2 space-y-1">
          {attachment.caption && <p className="text-xs line-clamp-2">{attachment.caption}</p>}
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(attachment.taken_at || attachment.created_at), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
