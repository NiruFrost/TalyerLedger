'use client'
/* eslint-disable @next/next/no-img-element -- Private attachment URLs are signed and expire, so they cannot be safely routed through the Next.js image optimizer. */

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { storageService } from '@/lib/storage/service'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import { format } from 'date-fns'
import type { Attachment } from '@/lib/types'

interface AttachmentViewerProps {
  attachments: Attachment[]
  initialIndex: number
  onClose: () => void
}

export function AttachmentViewer({ attachments, initialIndex, onClose }: AttachmentViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [url, setUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const current = attachments[index]

  useEffect(() => {
    if (current?.storage_path) {
      storageService.getSignedUrl(current.storage_path, 3600).then(setUrl).catch(() => setUrl(null))
    }
  }, [current?.storage_path])

  const goNext = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, attachments.length - 1))
    setZoom(1)
  }, [attachments.length])
  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(prev - 1, 0))
    setZoom(1)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  const category = ATTACHMENT_CATEGORIES.find((c) => c.value === current?.attachment_type)

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" role="dialog" aria-modal="true" aria-label="Attachment viewer">
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="hover:text-muted-foreground" aria-label="Close attachment viewer">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          {category && <span className={`rounded px-2 py-0.5 text-xs ${category.color}`}>{category.label}</span>}
          <span className="text-sm text-muted-foreground" aria-live="polite">{index + 1} / {attachments.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {attachments.length > 1 && index > 0 && (
          <button type="button" onClick={goPrev} className="absolute left-4 p-2 text-white/70 hover:text-white z-10" aria-label="Previous attachment">
            <ChevronLeft className="h-8 w-8" aria-hidden="true" />
          </button>
        )}
        {url ? (
          <img
            src={url}
            alt={current?.caption || 'Attachment'}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <div className="text-white/50">Loading...</div>
        )}
        {attachments.length > 1 && index < attachments.length - 1 && (
          <button type="button" onClick={goNext} className="absolute right-4 p-2 text-white/70 hover:text-white z-10" aria-label="Next attachment">
            <ChevronRight className="h-8 w-8" aria-hidden="true" />
          </button>
        )}
      </div>

      {current?.caption && (
        <div className="p-4 text-center text-sm text-white/80">
          <p>{current.caption}</p>
          <p className="text-xs text-white/50 mt-1">
            {format(new Date(current.taken_at || current.created_at), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
      )}
    </div>
  )
}
