import {
  ANALYTICS_SCRIPT_SETTINGS,
  ANALYTICS_SCRIPT_URL,
  COUNTED_REPORT_QUERY_KEYS,
  QUERY_COUNTED_PATH_PREFIX,
} from '@/constants/analytics/constants'
import type { AnalyticsEvent } from '@/constants/analytics/enums'
import { ANALYTICS_URL } from '@/constants/constants'

interface GoatCounterCountOptions {
  path: string
  event?: boolean
}

declare global {
  interface Window {
    goatcounter?: {
      url: (options: GoatCounterCountOptions) => string | undefined
      filter: () => string | false | undefined
    }
  }
}

let isAnalyticsScriptAdded = false

function sendCount(options: GoatCounterCountOptions): void {
  const goatcounter = window.goatcounter
  if (goatcounter === undefined || goatcounter.filter()) return
  const url = goatcounter.url(options)
  if (!url) return
  const countUrl = new URL(url)
  countUrl.searchParams.delete('q')
  navigator.sendBeacon(countUrl.toString())
}

export function getCountedPath(pathname: string, searchStr: string): string {
  if (!pathname.startsWith(QUERY_COUNTED_PATH_PREFIX)) return pathname
  const searchParams = new URLSearchParams(searchStr)
  const keptParams = new URLSearchParams()
  for (const key of COUNTED_REPORT_QUERY_KEYS) {
    const value = searchParams.get(key)
    if (value !== null) keptParams.set(key, value)
  }
  const kept = keptParams.toString()
  return kept === '' ? pathname : `${pathname}?${kept}`
}

export function countPageView(pathname: string, searchStr: string): void {
  sendCount({ path: getCountedPath(pathname, searchStr) })
}

export function countEvent(name: AnalyticsEvent): void {
  sendCount({ path: name, event: true })
}

export function loadAnalytics(): void {
  if (ANALYTICS_URL === '' || isAnalyticsScriptAdded) return
  isAnalyticsScriptAdded = true
  const script = document.createElement('script')
  script.async = true
  script.src = ANALYTICS_SCRIPT_URL
  script.dataset.goatcounter = ANALYTICS_URL
  script.dataset.goatcounterSettings = ANALYTICS_SCRIPT_SETTINGS
  script.addEventListener('load', () => {
    countPageView(window.location.pathname, window.location.search)
  })
  document.head.appendChild(script)
}
