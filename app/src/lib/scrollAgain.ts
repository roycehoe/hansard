interface ScrollAgainOptions {
  fontsReady: Promise<unknown>
  getScrollY: () => number
  scroll: () => void
}

// Web fonts change line heights after the first scroll, which moves the
// target. Scroll once more when they load, unless the reader has scrolled
// since or the caller has cancelled.
export function scrollAgainWhenFontsLoad({
  fontsReady,
  getScrollY,
  scroll,
}: ScrollAgainOptions): () => void {
  const scrollYAfterFirstScroll = getScrollY()
  let isCancelled = false
  void fontsReady.then(function scrollAgainUnlessMoved() {
    if (isCancelled) return
    if (getScrollY() !== scrollYAfterFirstScroll) return
    scroll()
  })
  return function cancelScrollAgain() {
    isCancelled = true
  }
}
