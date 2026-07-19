'use client'

import { AttachmentGallery } from './attachment-gallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttachmentCategory } from '@/lib/types'

interface DropoffInspectionProps {
  workOrderId: string
  conditionNotes?: string | null
  representativeName?: string | null
  representativeId?: string | null
}

export function DropoffInspection({ workOrderId, conditionNotes, representativeName }: DropoffInspectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Drop-off Inspection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditionNotes && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground">Vehicle Condition Notes</h4>
            <p className="text-sm">{conditionNotes}</p>
          </div>
        )}

        {representativeName && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground">Representative</h4>
            <p className="text-sm">{representativeName}</p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Vehicle Condition Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['vehicle_overview', 'damage'] as AttachmentCategory[]).map((cat) => (
              <div key={cat} className="space-y-1">
                <p className="text-xs capitalize text-muted-foreground">{cat.replace(/_/g, ' ')}</p>
                <AttachmentGallery
                  parentType="work_order"
                  parentId={workOrderId}
                  filterCategory={cat}
                />
              </div>
            ))}
          </div>
        </div>

        {representativeName && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground">Representative Documents</h4>
            <AttachmentGallery
              parentType="work_order"
              parentId={workOrderId}
              filterCategory={'authorization_letter' as AttachmentCategory}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
