import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonCoverageSummary() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  )
}
