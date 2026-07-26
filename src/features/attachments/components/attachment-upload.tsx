'use client'

import { useId, useState, useCallback } from 'react'
import { Upload, Camera, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logging/logger'
import { useUploadAttachment } from '../hooks/use-attachments'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserMessage } from '@/lib/errors/app-error'
import type { AttachmentParentType, AttachmentCategory } from '@/lib/types'

interface AttachmentUploadProps {
  parentType: AttachmentParentType
  parentId: string
  defaultCategory?: AttachmentCategory
  onSuccess?: () => void
  logDescription?: string
}

export function AttachmentUpload({ parentType, parentId, defaultCategory, onSuccess, logDescription }: AttachmentUploadProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(defaultCategory || 'other')
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fieldId = useId()
  const uploadMutation = useUploadAttachment()

  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    setErrorMessage(null)
    setFiles(Array.from(newFiles))
  }, [])

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    setProgress(0)
    setErrorMessage(null)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await uploadMutation.mutateAsync({
          file,
          parentType,
          parentId,
          category: category as AttachmentCategory,
          caption: caption || undefined,
          logDescription: logDescription ? `${logDescription}: ${file.name}` : undefined,
        })
        setProgress(((i + 1) / files.length) * 100)
      }
      setFiles([])
      setCaption('')
      setOpen(false)
      onSuccess?.()
    } catch (e) {
      setErrorMessage(getUserMessage(e))
      logger.error('upload_failed', {
        parentType,
        parentId,
        category,
        errorName: e instanceof Error ? e.name : 'UnknownError',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {isMobile ? <Camera className="mr-1 h-4 w-4" /> : <Upload className="mr-1 h-4 w-4" />}
        Upload
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setErrorMessage(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
            <DialogDescription>
              Add workshop evidence as JPG, PNG, or WebP images up to 10 MB each.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-category`}>Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as AttachmentCategory)}>
                <SelectTrigger id={`${fieldId}-category`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ATTACHMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-caption`}>Caption (optional)</Label>
              <Input
                id={`${fieldId}-caption`}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Brief description..."
              />
            </div>

            <Label
              htmlFor={`${fieldId}-files`}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            >
              <input
                id={`${fieldId}-files`}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                capture={isMobile ? 'environment' : undefined}
                className="sr-only"
                aria-describedby={`${fieldId}-file-help`}
                onChange={(e) => handleFiles(e.target.files)}
              />
              {files.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{files.length} file(s) selected</p>
                  <ul className="text-xs text-muted-foreground">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{f.name}</span>
                        <span>{(f.size / 1024).toFixed(0)} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  {isMobile ? (
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isMobile ? 'Tap to open camera or select from gallery' : 'Click, drag & drop, or paste files'}
                  </p>
                </div>
              )}
              <p id={`${fieldId}-file-help`} className="text-xs text-muted-foreground">
                JPG, PNG, or WEBP up to 10 MB; images are optimized before upload.
              </p>
            </Label>

            {errorMessage && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {Math.round(progress)}%
                </div>
                <div
                  className="h-2 bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Attachment upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
              <Button type="button" onClick={handleUpload} disabled={files.length === 0 || uploading}>
                {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
