import { NoticeErrorLoadMore } from '@/components/layout/NoticeErrorLoadMore'
import { NUMBER_LOCALE } from '@/constants/constants'
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll'
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
      <NoticeErrorLoadMore
        onRetry={onLoadMore}
        isRetrying={isFetchingNextPage}
      />
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
