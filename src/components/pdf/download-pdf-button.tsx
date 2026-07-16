'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import InvoicePDF from './invoice-pdf'
import { Button } from '@/components/ui/button'
import type { Job } from '@/lib/types'
import type { ShopSettings } from '@/features/settings/actions'

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

  return (
    <PDFDownloadLink
      document={<InvoicePDF job={job} shopSettings={shopSettings ?? undefined} />}
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
