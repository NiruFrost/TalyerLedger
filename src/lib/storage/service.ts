import { createClient } from '@/lib/supabase/client'

const BUCKET = 'attachments'

export interface UploadResult {
  path: string
  url: string
}

export interface StorageService {
  upload(file: File, path: string): Promise<UploadResult>
  getSignedUrl(path: string, expiresIn?: number): Promise<string>
  delete(path: string): Promise<void>
  getPublicUrl(path: string): string
}

async function ensureBucket(): Promise<void> {
  const supabase = createClient()
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10 * 1024 * 1024 })
  }
}

export const storageService: StorageService = {
  async upload(file: File, path: string): Promise<UploadResult> {
    const supabase = createClient()
    await ensureBucket()
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' })
    if (error) throw error
    const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24)
    return { path, url: urlData?.signedUrl ?? '' }
  },

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const supabase = createClient()
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
    return data?.signedUrl ?? ''
  },

  async delete(path: string): Promise<void> {
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([path])
  },

  getPublicUrl(path: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  },
}
