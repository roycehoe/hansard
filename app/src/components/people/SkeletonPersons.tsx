import { Skeleton } from '@/components/ui/skeleton'

const FILTER_WIDTHS = ['sm:w-72', 'sm:w-56']

const PERSON_ROW_COUNT = 8

export function SkeletonPersons() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="hidden w-full flex-col gap-2 min-[32rem]:flex md:w-56">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="flex w-full gap-2 min-[32rem]:hidden">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
        {FILTER_WIDTHS.map((filterWidth, index) => (
          <div
            key={index}
            className={`hidden w-full flex-col gap-2 min-[32rem]:flex ${filterWidth}`}
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="hidden h-9 w-16 min-[32rem]:block" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <ol>
          {Array.from({ length: PERSON_ROW_COUNT }, (_, index) => (
            <li
              key={index}
              className="border-separator space-y-1 border-b py-3 last:border-b-0"
            >
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
