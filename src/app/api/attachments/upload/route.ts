import { NextResponse } from 'next/server'
import sharp from 'sharp'
import {
  ATTACHMENT_ACCEPTED_MIMES,
  ATTACHMENT_FULL_WIDTH,
  ATTACHMENT_MAX_PIXELS,
  ATTACHMENT_SERVER_UPLOAD_MAX_SIZE_BYTES,
  ATTACHMENT_THUMBNAIL_WIDTH,
} from '@/lib/constants'
import { logger } from '@/lib/logging/logger'
import { hasTrustedOrigin } from '@/lib/security/request-origin'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const BUCKET = 'attachments'
const SAFE_PATH = /^(vehicle|work_order|line_item|customer)\/([0-9a-f-]{36})\/[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i

const parentTables = {
  vehicle: 'vehicles',
  work_order: 'work_orders',
  line_item: 'line_items',
  customer: 'customers',
} as const

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'A multipart image upload is required.' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > ATTACHMENT_SERVER_UPLOAD_MAX_SIZE_BYTES + 256_000) {
    return NextResponse.json({ error: 'The upload is too large.' }, { status: 413 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 })

  const rateLimit = checkRateLimit(`attachment-upload:${user.id}`, 20, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Wait briefly and try again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'The upload body could not be read.' }, { status: 400 })
  }
  const file = form.get('file')
  const relativePath = form.get('path')
  if (!(file instanceof File) || typeof relativePath !== 'string') {
    return NextResponse.json({ error: 'A valid image and destination are required.' }, { status: 400 })
  }
  if (file.size > ATTACHMENT_SERVER_UPLOAD_MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'The processed image is too large to upload. Choose a smaller image.' },
      { status: 413 },
    )
  }
  if (!ATTACHMENT_ACCEPTED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: 'The image type is not allowed.' }, { status: 400 })
  }

  const pathMatch = relativePath.match(SAFE_PATH)
  if (!pathMatch) return NextResponse.json({ error: 'The attachment path is invalid.' }, { status: 400 })

  const parentType = pathMatch[1] as keyof typeof parentTables
  const parentId = pathMatch[2]
  const { data: parent, error: parentError } = await supabase
    .from(parentTables[parentType])
    .select('id')
    .eq('id', parentId)
    .is('deleted_at', null)
    .maybeSingle()
  if (parentError || !parent) {
    return NextResponse.json({ error: 'The attachment parent is unavailable.' }, { status: 403 })
  }

  const { data: workshopId, error: workshopError } = await supabase.rpc('current_workshop_id')
  if (workshopError || !workshopId) {
    return NextResponse.json({ error: 'Workshop access could not be verified.' }, { status: 403 })
  }

  try {
    const source = Buffer.from(await file.arrayBuffer())
    const isThumbnail = relativePath.includes('_thumb.')
    const image = sharp(source, { limitInputPixels: ATTACHMENT_MAX_PIXELS }).rotate()
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
      return NextResponse.json({ error: 'The file is not a supported image.' }, { status: 400 })
    }

    const maxDimension = isThumbnail ? ATTACHMENT_THUMBNAIL_WIDTH : ATTACHMENT_FULL_WIDTH
    const output = await image
      .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: isThumbnail ? 70 : 85, mozjpeg: true })
      .toBuffer()
    const finalPath = `${workshopId}/${relativePath.replace(/\.[^.]+$/, '.jpg')}`

    const admin = createAdminSupabaseClient()
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(finalPath, output, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (uploadError) throw uploadError

    return NextResponse.json({ path: finalPath })
  } catch (error) {
    logger.error('attachment_upload_failed', {
      userId: user.id,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.json({ error: 'The image could not be stored. Try again.' }, { status: 500 })
  }
}
