import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const ENTRY_ROW_COUNT = 4

export function SkeletonAct() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader hasDescription={false} />
      <div className="space-y-4">
        <div className="flex flex-wrap-reverse items-center justify-end gap-2">
          <Skeleton className="mr-auto h-9 w-72" />
          <Skeleton className="h-5 w-56" />
        </div>
        <ol>
          {Array.from({ length: ENTRY_ROW_COUNT }, (_, index) => (
            <li
              key={index}
              className="border-separator space-y-2 border-b py-4 last:border-b-0"
            >
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
