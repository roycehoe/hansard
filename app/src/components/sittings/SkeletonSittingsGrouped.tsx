import { Skeleton } from '@/components/ui/skeleton'

const SITTING_ROW_COUNT = 16
const YEAR_LINK_COUNT = 6

export function SkeletonSittingsGrouped() {
  return (
    <div className="-mt-6 space-y-8">
      <div className="border-separator -mx-5 flex gap-5 overflow-hidden border-b px-5 sm:mx-0 sm:gap-6 sm:px-0">
        {Array.from({ length: YEAR_LINK_COUNT }, (_, index) => (
          <div key={index} className="flex h-11 items-center sm:h-10">
            <Skeleton className="h-5 w-9" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-1 h-7 w-16 lg:h-8" />
        <Skeleton className="mb-1 h-5 w-40" />
        <ol className="sm:max-w-120">
          {Array.from({ length: SITTING_ROW_COUNT }, (_, index) => (
            <li
              key={index}
              className="border-separator grid min-h-11 grid-cols-[1fr_84px_96px] items-center gap-x-2 border-b last:border-b-0"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="ml-auto h-5 w-20" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
