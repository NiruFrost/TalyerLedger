'use client'

import { JOB_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { WorkOrderStatus } from '@/lib/types'

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus
}

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
  const jobStatus = JOB_STATUSES.find((s) => s.value === status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
        jobStatus?.color ?? 'bg-gray-500'
      )}
    >
      {jobStatus?.label ?? status}
    </span>
  )
}
