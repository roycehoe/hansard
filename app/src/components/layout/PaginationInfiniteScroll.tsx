import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { NUMBER_LOCALE } from '@/constants/constants'
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll'
import { RotateCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

interface PaginationInfiniteScrollProps {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onLoadMore: () => void
  loadingRows: ReactNode
  shownCount: number
  totalCount?: number
  isTotalCapped?: boolean
}

export function PaginationInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  loadingRows,
  shownCount,
  totalCount,
  isTotalCapped = false,
}: PaginationInfiniteScrollProps) {
  const { sentinelRef } = useLoadMoreOnScroll({
    canLoadMore: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    onLoadMore,
  })
  const hasMoreThanShown =
    isTotalCapped || (totalCount !== undefined && shownCount < totalCount)

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
    return loadingRows
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
