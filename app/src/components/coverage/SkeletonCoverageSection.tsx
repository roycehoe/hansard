import { Skeleton } from '@/components/ui/skeleton'

const TEXT_LINE_COUNT = 3

interface SkeletonCoverageSectionProps {
  tableRowCount: number
}

export function SkeletonCoverageSection({
  tableRowCount,
}: SkeletonCoverageSectionProps) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-64" />
      <div className="max-w-prose space-y-2">
        {Array.from({ length: TEXT_LINE_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
      {tableRowCount > 0 && (
        <div className="max-w-xl">
          {Array.from({ length: tableRowCount }, (_, index) => (
            <div
              key={index}
              className="border-separator flex h-12 items-center justify-between border-b last:border-b-0"
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
