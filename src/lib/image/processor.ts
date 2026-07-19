import { ATTACHMENT_ACCEPTED_MIMES, ATTACHMENT_MAX_SIZE_BYTES, ATTACHMENT_FULL_WIDTH, ATTACHMENT_THUMBNAIL_WIDTH } from '@/lib/constants'

export interface ProcessedImage {
  file: File
  thumbnailBlob: Blob
  width: number
  height: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImage(file: File): ValidationResult {
  if (!ATTACHMENT_ACCEPTED_MIMES.includes(file.type)) {
    return { valid: false, error: `Unsupported format "${file.type}". Accepted: JPG, PNG, WEBP` }
  }
  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    const maxMB = ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024)
    return { valid: false, error: `File exceeds ${maxMB}MB limit` }
  }
  return { valid: true }
}

function stripExif(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
  ctx.drawImage(image, 0, 0)
}

function resizeImage(image: HTMLImageElement, maxWidth: number): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = image
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width))
    width = maxWidth
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  stripExif(ctx, image)
  return { canvas, width, height }
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const validation = validateImage(file)
  if (!validation.valid) throw new Error(validation.error)

  const image = await loadImage(file)

  const { canvas: fullCanvas, width, height } = resizeImage(image, ATTACHMENT_FULL_WIDTH)

  const fullBlob = await new Promise<Blob>((resolve, reject) => {
    fullCanvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Failed to encode image'))
    }, file.type, 0.85)
  })

  const { canvas: thumbCanvas } = resizeImage(image, ATTACHMENT_THUMBNAIL_WIDTH)
  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Failed to encode thumbnail'))
    }, file.type, 0.7)
  })

  const processedFile = new File([fullBlob], file.name, { type: file.type })

  return { file: processedFile, thumbnailBlob, width, height }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image'))
    }
    img.src = url
  })
}
