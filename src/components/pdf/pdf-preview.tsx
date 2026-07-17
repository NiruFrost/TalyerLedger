'use client'

import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import JobPDF from './invoice-pdf'
import { Button } from '@/components/ui/button'
import type { Job } from '@/lib/types'
import type { ShopSettings } from '@/features/settings/actions'

interface PdfPreviewProps {
  job: Job
  shopSettings?: ShopSettings | null
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, '').trim() || 'unknown'
}

export default function PdfPreview({ job, shopSettings }: PdfPreviewProps) {
  const plate = job.vehicle?.plate ? sanitize(job.vehicle.plate) : 'noplate'
  const lastName = job.customer?.name
    ? sanitize(job.customer.name.split(/\s+/).pop() ?? 'unknown')
    : 'unknown'
  const model = job.vehicle?.model ? sanitize(job.vehicle.model) : 'unknown'
  const fileName = `${job.estimate_no}-${plate}-${lastName}-${model}.pdf`

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<JobPDF job={job} shopSettings={shopSettings ?? undefined} />}
          fileName={fileName}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Generating...' : `Download ${fileName}`}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <PDFViewer style={{ width: '100%', height: 'calc(100vh - 12rem)' }}>
        <JobPDF job={job} shopSettings={shopSettings ?? undefined} />
      </PDFViewer>
    </div>
  )
}
