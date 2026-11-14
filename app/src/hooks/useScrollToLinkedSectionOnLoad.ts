import { useEffect, useLayoutEffect, useRef } from 'react'

const READER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown'] as const

// Content that loads above a linked section moves the section after the
// router has scrolled to it. Browsers without scroll anchoring, such as
// Safari 26, then leave the reader screens above it, so scroll to it again
// once the content loads, unless the reader has scrolled since.
export function useScrollToLinkedSectionOnLoad(isLoading: boolean) {
  const isWaitingToScroll = useRef<boolean>(isLoading)
  const hasReaderScrolled = useRef<boolean>(false)

  useEffect(function noteReaderScroll() {
    function markReaderScrolled() {
      hasReaderScrolled.current = true
    }
    for (const eventType of READER_SCROLL_EVENTS) {
      window.addEventListener(eventType, markReaderScrolled, { passive: true })
    }
    return function stopNotingReaderScroll() {
      for (const eventType of READER_SCROLL_EVENTS) {
        window.removeEventListener(eventType, markReaderScrolled)
      }
    }
  }, [])

  useLayoutEffect(
    function scrollToLinkedSectionOnLoad() {
      if (isLoading || !isWaitingToScroll.current) return
      isWaitingToScroll.current = false
      if (hasReaderScrolled.current) return
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    },
    [isLoading]
  )
}
