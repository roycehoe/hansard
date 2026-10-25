import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonCoverageSummary() {
  return (
    <div className="space-y-2">
      <div className="space-y-2 py-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="space-y-2 py-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
