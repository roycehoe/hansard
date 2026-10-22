import { Skeleton } from '@/components/ui/skeleton'

const FILTER_WIDTHS = ['sm:w-56', 'sm:w-56', 'sm:w-72', 'sm:w-56']

const PERSON_ROW_COUNT = 8

export function SkeletonPersons() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        {FILTER_WIDTHS.map((filterWidth, index) => (
          <div
            key={index}
            className={`flex w-full flex-col gap-2 ${filterWidth}`}
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
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
  )
}
