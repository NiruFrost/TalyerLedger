'use client'

import { useQuery } from '@tanstack/react-query'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import JobPDF from './invoice-pdf'
import { Button } from '@/components/ui/button'
import { getAttachments } from '@/features/attachments/actions'
import { storageService } from '@/lib/storage/service'
import type { Job } from '@/lib/types'
import type { ShopSettings } from '@/features/settings/actions'
import { ATTACHMENT_CATEGORIES } from '@/lib/constants'

interface DownloadPdfButtonProps {
  job: Job
  shopSettings?: ShopSettings | null
  variant?: 'default' | 'outline'
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, '').trim() || 'unknown'
}

export default function DownloadPdfButton({
  job,
  shopSettings,
  variant = 'outline',
}: DownloadPdfButtonProps) {
  const plate = job.vehicle?.plate ? sanitize(job.vehicle.plate) : 'noplate'
  const lastName = job.customer?.name
    ? sanitize(job.customer.name.split(/\s+/).pop() ?? 'unknown')
    : 'unknown'
  const model = job.vehicle?.model ? sanitize(job.vehicle.model) : 'unknown'
  const fileName = `${job.estimate_no}-${plate}-${lastName}-${model}.pdf`

  const includePhotos = shopSettings?.include_photo_appendix ?? false

  const { data: attachmentUrls } = useQuery({
    queryKey: ['pdf-attachments', job.id],
    queryFn: async () => {
      const attachments = await getAttachments('work_order', job.id)
      const urls = await Promise.all(
        attachments.map(async (a) => {
          try {
            const url = await storageService.getSignedUrl(a.storage_path, 7200)
            const cat = ATTACHMENT_CATEGORIES.find((c) => c.value === a.attachment_type)
            return { url, caption: a.caption, category: cat?.label }
          } catch {
            return null
          }
        })
      )
      return urls.filter(Boolean) as { url: string; caption?: string | null; category?: string }[]
    },
    enabled: includePhotos,
  })

  return (
    <PDFDownloadLink
      document={
        <JobPDF
          job={job}
          shopSettings={shopSettings ?? undefined}
          includePhotoAppendix={includePhotos}
          attachmentUrls={attachmentUrls}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant={variant} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Generating...' : 'PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
