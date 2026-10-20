import { Skeleton } from '@/components/ui/skeleton'

const SITTING_ROW_COUNT = 8

export function SkeletonSittingsGrouped() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-32" />
      <ol>
        {Array.from({ length: SITTING_ROW_COUNT }, (_, index) => (
          <li
            key={index}
            className="border-separator flex flex-wrap gap-x-4 gap-y-1 border-b py-3 last:border-b-0"
          >
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </li>
        ))}
      </ol>
    </div>
  )
}
