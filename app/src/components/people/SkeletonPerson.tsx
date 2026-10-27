import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { SkeletonReportRows } from '@/components/reports/SkeletonReportRows'
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
      <SkeletonPageHeader hasDescription />
      <SkeletonTableSection />
      <SkeletonTableSection />
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <SkeletonReportRows />
      </div>
    </div>
  )
}
