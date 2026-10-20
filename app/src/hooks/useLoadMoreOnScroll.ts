import { useEffect, useEffectEvent, useRef } from 'react'

const PRELOAD_MARGIN = '0px 0px 400px 0px'

interface UseLoadMoreOnScrollOptions {
  canLoadMore: boolean
  onLoadMore: () => void
}

export function useLoadMoreOnScroll({
  canLoadMore,
  onLoadMore,
}: UseLoadMoreOnScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMore = useEffectEvent(onLoadMore)

  useEffect(
    function observeSentinel() {
      const sentinel = sentinelRef.current
      if (!canLoadMore || sentinel === null) return
      const observer = new IntersectionObserver(
        function loadMoreWhenSentinelIsNear(entries) {
          if (entries.some((entry) => entry.isIntersecting)) loadMore()
        },
        { rootMargin: PRELOAD_MARGIN }
      )
      observer.observe(sentinel)
      return function stopObservingSentinel() {
        observer.disconnect()
      }
    },
    [canLoadMore]
  )

  return { sentinelRef }
}
