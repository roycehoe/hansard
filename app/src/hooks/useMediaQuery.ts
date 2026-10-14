import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  const isMatching = useSyncExternalStore(
    function subscribeToMediaQuery(onChange) {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onChange)
      return function unsubscribeFromMediaQuery() {
        mediaQueryList.removeEventListener('change', onChange)
      }
    },
    function getMediaQueryMatch() {
      return window.matchMedia(query).matches
    }
  )

  return { isMatching }
}
