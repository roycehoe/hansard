import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { SkeletonReportRows } from '@/components/reports/SkeletonReportRows'
import { Skeleton } from '@/components/ui/skeleton'

const ATTENDANCE_ROW_COUNT = 6

export function SkeletonSitting() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader hasDescription />
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <SkeletonReportRows />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: ATTENDANCE_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full max-w-xs" />
          ))}
        </div>
      </div>
    </div>
  )
}
