import { Skeleton } from '@/components/ui/skeleton'

const FILTER_WIDTHS = ['sm:w-56', 'sm:w-56', 'sm:w-44', 'sm:w-44', 'sm:w-56']

export function SkeletonFormSearch() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex w-full flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
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
      <Skeleton className="hidden h-9 w-20 min-[32rem]:block" />
    </div>
  )
}
