'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Unable to load this page',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center text-card-foreground"
    >
      <AlertTriangle aria-hidden="true" className="size-7 text-destructive" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Try again
        </Button>
      )}
    </section>
  )
}
