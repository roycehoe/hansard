import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const ENTRY_ROW_COUNT = 4

export function SkeletonAct() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader hasDescription={false} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-4 w-full max-w-prose" />
      </div>
      <ol>
        {Array.from({ length: ENTRY_ROW_COUNT }, (_, index) => (
          <li
            key={index}
            className="border-separator space-y-2 border-b py-4 last:border-b-0"
          >
            <Skeleton className="h-6 w-full max-w-md" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-5 w-48" />
          </li>
        ))}
      </ol>
    </div>
  )
}
