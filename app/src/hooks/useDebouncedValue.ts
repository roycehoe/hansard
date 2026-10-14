import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(
    function syncDebouncedValue() {
      const timer = setTimeout(() => {
        setDebouncedValue(value)
      }, delayMs)
      return function cancelDebounce() {
        clearTimeout(timer)
      }
    },
    [value, delayMs]
  )

  return { debouncedValue }
}
