import { Skeleton } from '@/components/ui/skeleton'

const PARLIAMENT_ROW_COUNT = 6

export function SkeletonParliaments() {
  return (
    <ul>
      {Array.from({ length: PARLIAMENT_ROW_COUNT }, (_, index) => (
        <li
          key={index}
          className="border-separator flex flex-col gap-1 border-b py-3 last:border-b-0"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </li>
      ))}
    </ul>
  )
}
