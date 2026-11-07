import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TEXT_LINE_COUNT = 3

interface SkeletonCoverageSectionProps {
  tableRowCount: number
  isSectionHeading: boolean
}

export function SkeletonCoverageSection({
  tableRowCount,
  isSectionHeading,
}: SkeletonCoverageSectionProps) {
  return (
    <div className="space-y-4">
      <div className={cn(isSectionHeading && 'border-separator border-b pb-1')}>
        <Skeleton className="h-7 w-64" />
      </div>
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
