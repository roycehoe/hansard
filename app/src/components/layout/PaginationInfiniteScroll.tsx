import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { NUMBER_LOCALE } from '@/constants/constants'
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll'
import { RotateCw, TriangleAlert } from 'lucide-react'

const LOADING_ROW_COUNT = 3

interface PaginationInfiniteScrollProps {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onLoadMore: () => void
  shownCount: number
  totalCount: number
  isTotalCapped: boolean
}

export function PaginationInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  shownCount,
  totalCount,
  isTotalCapped,
}: PaginationInfiniteScrollProps) {
  const { sentinelRef } = useLoadMoreOnScroll({
    canLoadMore: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    onLoadMore,
  })
  const hasMoreThanShown = isTotalCapped || shownCount < totalCount

  if (isFetchNextPageError) {
    return (
      <div className="border-separator flex flex-wrap items-center gap-4 border-t py-4">
        <div className="flex flex-row gap-4">
          <TriangleAlert className="text-destructive" />
          <p className="text-destructive">More results did not load.</p>
        </div>
        <Button
          variant="outline"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage ? (
            <>
              <Spinner />
              Retrying…
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4" />
              Try again
            </>
          )}
        </Button>
      </div>
    )
  }
  if (isFetchingNextPage) {
    return (
      <div className="space-y-4" aria-busy="true">
        {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
          <div key={index} className="border-separator space-y-2 border-t pt-4">
            <Skeleton className="h-5 w-full max-w-md" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }
  if (hasNextPage) return <div ref={sentinelRef} />
  if (!hasMoreThanShown) return null
  return (
    <p className="text-muted-foreground border-separator border-t pt-4 text-sm">
      Showing the first {shownCount.toLocaleString(NUMBER_LOCALE)}. Narrow the
      search to see more.
    </p>
  )
}
