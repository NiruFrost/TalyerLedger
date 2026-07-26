import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}
