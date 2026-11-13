import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const ENTRY_ROW_COUNT = 4

export function SkeletonAct() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader hasDescription={false} />
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-5 w-56" />
        </div>
        <ol>
          {Array.from({ length: ENTRY_ROW_COUNT }, (_, index) => (
            <li key={index} className="space-y-2 py-3 pl-8">
              <Skeleton className="h-6 w-full max-w-md" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-64" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
