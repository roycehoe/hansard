import { Skeleton } from '@/components/ui/skeleton'

const READING_ROW_COUNT = 5

export function SkeletonTimelineReadings() {
  return (
    <ol className="p-1">
      {Array.from({ length: READING_ROW_COUNT }, (_, index) => (
        <li key={index} className="space-y-1.5 py-2 pr-3 pl-9">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
        </li>
      ))}
    </ol>
  )
}
