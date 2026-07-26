'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/shared/error-state'
import { logger } from '@/lib/logging/logger'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('dashboard_route_error', { errorName: error.name, digest: error.digest })
  }, [error])

  return (
    <ErrorState
      message="Workshop data could not be loaded. Check your connection, then try again."
      onRetry={reset}
    />
  )
}
