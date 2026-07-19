'use client'

import { useState, useRef, useEffect } from 'react'
import { storageService } from '@/lib/storage/service'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import type { Attachment } from '@/lib/types'

interface BeforeAfterComparisonProps {
  beforeAttachments: Attachment[]
  afterAttachments: Attachment[]
}

export function BeforeAfterComparison({ beforeAttachments, afterAttachments }: BeforeAfterComparisonProps) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null)
  const [afterUrl, setAfterUrl] = useState<string | null>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [mode, setMode] = useState<'slider' | 'side'>('slider')
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const before = beforeAttachments[0]
  const after = afterAttachments[0]

  useEffect(() => {
    if (before?.storage_path) storageService.getSignedUrl(before.storage_path, 3600).then(setBeforeUrl)
    if (after?.storage_path) storageService.getSignedUrl(after.storage_path, 3600).then(setAfterUrl)
  }, [before, after])

  const handleMouseDown = () => { isDragging.current = true }
  const handleMouseUp = () => { isDragging.current = false }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setSliderPos(Math.max(0, Math.min(100, x)))
  }

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {!before && !after && 'No before/after images available.'}
        {(!before || !after) && 'Need both before and after images for comparison.'}
      </div>
    )
  }

  const beforeLabel = ATTACHMENT_CATEGORIES.find((c) => c.value === 'before')?.label || 'Before'
  const afterLabel = ATTACHMENT_CATEGORIES.find((c) => c.value === 'after')?.label || 'After'

  if (mode === 'side') {
    return (
      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          <button onClick={() => setMode('slider')} className="text-xs text-muted-foreground hover:text-foreground">Slider View</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-center">{beforeLabel}</p>
            <img src={beforeUrl} alt="Before" className="w-full rounded-lg" loading="lazy" />
            {before?.caption && <p className="text-[10px] text-muted-foreground text-center">{before.caption}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-center">{afterLabel}</p>
            <img src={afterUrl} alt="After" className="w-full rounded-lg" loading="lazy" />
            {after?.caption && <p className="text-[10px] text-muted-foreground text-center">{after.caption}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <button onClick={() => setMode('side')} className="text-xs text-muted-foreground hover:text-foreground">Side by Side</button>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg select-none cursor-ew-resize"
        style={{ aspectRatio: '16/9', maxHeight: '400px' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={() => { isDragging.current = true }}
        onTouchEnd={() => { isDragging.current = false }}
        onTouchMove={(e) => {
          if (!isDragging.current || !containerRef.current) return
          const rect = containerRef.current.getBoundingClientRect()
          const touch = e.touches[0]
          const x = ((touch.clientX - rect.left) / rect.width) * 100
          setSliderPos(Math.max(0, Math.min(100, x)))
        }}
      >
        <img src={afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable={false} style={{ width: `${100 / (sliderPos / 100)}%` }} />
        </div>
        <div className="absolute inset-y-0" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
          <div className="h-full w-0.5 bg-white shadow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">↔</span>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{beforeLabel}</div>
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">{afterLabel}</div>
      </div>
    </div>
  )
}
