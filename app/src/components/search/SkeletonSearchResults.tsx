import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonSearchResultsProps {
  rowCount: number
}

export function SkeletonSearchResults({
  rowCount,
}: SkeletonSearchResultsProps) {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: rowCount }, (_, index) => (
        <div key={index} className="border-separator space-y-2 border-t pt-4">
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
