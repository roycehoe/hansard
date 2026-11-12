import { Skeleton } from '@/components/ui/skeleton'

const ACT_ROW_COUNT = 8

export function SkeletonActs() {
  return (
    <div className="space-y-6">
      <div className="flex max-w-md flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <ol>
          {Array.from({ length: ACT_ROW_COUNT }, (_, index) => (
            <li
              key={index}
              className="border-separator border-b py-3 last:border-b-0"
            >
              <Skeleton className="h-5 w-full max-w-md" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
