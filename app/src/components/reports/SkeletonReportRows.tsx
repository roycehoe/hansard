import { Skeleton } from '@/components/ui/skeleton'

const REPORT_ROW_COUNT = 5

export function SkeletonReportRows() {
  return (
    <ol>
      {Array.from({ length: REPORT_ROW_COUNT }, (_, index) => (
        <li
          key={index}
          className="border-separator flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-3 last:border-b-0"
        >
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </li>
      ))}
    </ol>
  )
}
