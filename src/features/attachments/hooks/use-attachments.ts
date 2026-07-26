'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, getAttachmentsByCategory, createAttachment, updateAttachment, deleteAttachment, createAttachmentAndLog } from '../actions'
import { storageService } from '@/lib/storage/service'
import { processImage, validateImage } from '@/lib/image/processor'
import { AppError } from '@/lib/errors/app-error'
import { queryKeys } from '@/lib/query/keys'
import type { AttachmentInsert, AttachmentUpdate, AttachmentParentType, AttachmentCategory } from '@/lib/types'

export function useAttachments(parentType: AttachmentParentType, parentId: string) {
  return useQuery({
    queryKey: queryKeys.attachments.byParent(parentType, parentId),
    queryFn: () => getAttachments(parentType, parentId),
    enabled: !!parentId,
  })
}

export function useAttachmentsByCategory(parentType: AttachmentParentType, parentId: string) {
  return useQuery({
    queryKey: queryKeys.attachments.grouped(parentType, parentId),
    queryFn: () => getAttachmentsByCategory(parentType, parentId),
    enabled: !!parentId,
  })
}

export function useCreateAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AttachmentInsert) => createAttachment(data),
    onSuccess: (result) => {
      qc.invalidateQueries({
        queryKey: queryKeys.attachments.byParent(result.parent_type, result.parent_id),
      })
    },
  })
}

export function useUpdateAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AttachmentUpdate }) => updateAttachment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attachments.all }),
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      storagePath,
    }: {
      id: string
      storagePath?: string
      parentType: AttachmentParentType
      parentId: string
    }) => {
      void storagePath
      await deleteAttachment(id)
    },
    onSuccess: (_result, variables) =>
      qc.invalidateQueries({
        queryKey: queryKeys.attachments.byParent(variables.parentType, variables.parentId),
      }),
  })
}

export function useUploadAttachment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      parentType,
      parentId,
      category,
      caption,
      logDescription,
    }: {
      file: File
      parentType: AttachmentParentType
      parentId: string
      category: AttachmentCategory
      caption?: string
      logDescription?: string
    }) => {
      const validation = validateImage(file)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', validation.error)
      }

      let processed
      try {
        processed = await processImage(file)
      } catch (error) {
        throw new AppError(
          'VALIDATION_ERROR',
          error instanceof Error ? error.message : 'The image could not be processed.',
          error,
        )
      }
      const ext = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const basePath = `${parentType}/${parentId}/${category}_${timestamp}`

      const uploadResult = await storageService.upload(processed.file, `${basePath}.${ext}`)

      let thumbnailPath: string | null = null
      if (processed.thumbnailBlob) {
        const thumbFile = new File([processed.thumbnailBlob], `thumb_${timestamp}.${ext}`, { type: file.type })
        const thumbResult = await storageService.upload(thumbFile, `${basePath}_thumb.${ext}`)
        thumbnailPath = thumbResult.path
      }

      const insertData: AttachmentInsert = {
        parent_type: parentType,
        parent_id: parentId,
        attachment_type: category,
        file_kind: 'image',
        mime_type: 'image/jpeg',
        storage_path: uploadResult.path,
        thumbnail_path: thumbnailPath,
        caption: caption || null,
        file_size: processed.file.size,
        original_filename: file.name,
        width: processed.width,
        height: processed.height,
        taken_at: new Date().toISOString(),
      }

      if (logDescription) {
        return createAttachmentAndLog(insertData, logDescription)
      }
      return createAttachment(insertData)
    },
    onSuccess: (result) => {
      if (result) {
        qc.invalidateQueries({
          queryKey: queryKeys.attachments.byParent(result.parent_type, result.parent_id),
        })
      }
    },
  })
}
