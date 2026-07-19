'use client'

import { AttachmentGallery } from './attachment-gallery'

interface LineItemAttachmentsProps {
  lineItemId: string
  lineItemName: string
}

export function LineItemAttachments({ lineItemId, lineItemName }: LineItemAttachmentsProps) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <h4 className="text-sm font-medium">{lineItemName}</h4>
      <AttachmentGallery
        parentType="line_item"
        parentId={lineItemId}
        logDescription={`Evidence for ${lineItemName}`}
      />
    </div>
  )
}
