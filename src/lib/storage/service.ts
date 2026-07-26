import { createClient } from '@/lib/supabase/client'

const BUCKET = 'attachments'

export interface UploadResult {
  path: string
  url: string
}

export interface StorageService {
  upload(file: File, path: string): Promise<UploadResult>
  getSignedUrl(path: string, expiresIn?: number): Promise<string>
}

export const storageService: StorageService = {
  async upload(file: File, path: string): Promise<UploadResult> {
    const form = new FormData()
    form.set('file', file)
    form.set('path', path)
    const response = await fetch('/api/attachments/upload', { method: 'POST', body: form })
    const result = await response.json() as { path?: string; error?: string }
    if (!response.ok || !result.path) throw new Error(result.error ?? 'Attachment upload failed')

    return { path: result.path, url: '' }
  },

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
    if (error || !data?.signedUrl) throw error ?? new Error('Signed attachment URL was not returned')
    return data.signedUrl
  },
}
