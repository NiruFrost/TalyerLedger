'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/shared/error-state'
import { logger } from '@/lib/logging/logger'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('route_error', { errorName: error.name, digest: error.digest })
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <ErrorState
        message="The page encountered an unexpected problem. Your saved records were not changed."
        onRetry={reset}
      />
    </main>
  )
}
