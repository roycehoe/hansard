import { SkeletonPersonReports } from '@/components/people/SkeletonPersonReports'
import { Skeleton } from '@/components/ui/skeleton'

const TABLE_ROW_COUNT = 3

function SkeletonTableSection() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <div>
        {Array.from({ length: TABLE_ROW_COUNT }, (_, index) => (
          <div
            key={index}
            className="border-separator flex gap-6 border-b py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonPerson() {
  return (
    <div className="space-y-8">
      <div className="border-separator space-y-4 border-b pb-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-full max-w-xs lg:h-9" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-56" />
        </div>
      </div>
      <SkeletonTableSection />
      <SkeletonTableSection />
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <SkeletonPersonReports />
      </div>
    </div>
  )
}
