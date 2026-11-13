import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const EVENT_ROW_COUNT = 8

export function SkeletonAct() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader hasDescription={false} />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <Skeleton className="mr-auto h-5 w-80 max-w-full" />
          <Skeleton className="h-5 w-56" />
        </div>
        <ol>
          {Array.from({ length: EVENT_ROW_COUNT }, (_, index) => (
            <li key={index} className="py-2 pl-8">
              <Skeleton className="h-6 w-full max-w-xl" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
