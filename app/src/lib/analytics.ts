import {
  ANALYTICS_SCRIPT_CROSS_ORIGIN,
  ANALYTICS_SCRIPT_INTEGRITY,
  ANALYTICS_SCRIPT_SETTINGS,
  ANALYTICS_SCRIPT_URL,
  COUNT_QUERY_FIELD,
  COUNT_REFERRER_FIELD,
  COUNT_TITLE_FIELD,
  COUNTED_REPORT_QUERY_KEYS,
  LAST_VISIT_STORAGE_KEY,
  QUERY_COUNTED_PATH_PREFIX,
} from '@/constants/analytics/constants'
import { AnalyticsEvent } from '@/constants/analytics/enums'
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
const countedPaths = new Set<string>()

function getReferrerWithoutQuery(referrer: string): string | undefined {
  try {
    const { origin, pathname } = new URL(referrer)
    return `${origin}${pathname}`
  } catch {
    return undefined
  }
}

function isCountAddressValid(countAddress: string): boolean {
  try {
    new URL(countAddress)
    return true
  } catch {
    return false
  }
}

function sendCount(options: GoatCounterCountOptions): void {
  const goatcounter = window.goatcounter
  if (goatcounter === undefined || goatcounter.filter()) return
  const url = goatcounter.url(options)
  if (!url) return
  const countUrl = new URL(url)
  countUrl.searchParams.delete(COUNT_QUERY_FIELD)
  countUrl.searchParams.delete(COUNT_TITLE_FIELD)
  const referrer = getReferrerWithoutQuery(
    countUrl.searchParams.get(COUNT_REFERRER_FIELD) ?? ''
  )
  if (referrer === undefined) {
    countUrl.searchParams.delete(COUNT_REFERRER_FIELD)
  } else {
    countUrl.searchParams.set(COUNT_REFERRER_FIELD, referrer)
  }
  navigator.sendBeacon(countUrl.toString())
}

export function getCountedPath(
  pathname: string,
  searchStr: string,
  isPathAlreadyCounted: boolean
): string {
  if (!pathname.startsWith(QUERY_COUNTED_PATH_PREFIX)) return pathname
  if (isPathAlreadyCounted) return pathname
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
  const isPathAlreadyCounted = countedPaths.has(pathname)
  countedPaths.add(pathname)
  sendCount({ path: getCountedPath(pathname, searchStr, isPathAlreadyCounted) })
}

export function countEvent(name: AnalyticsEvent): void {
  sendCount({ path: name, event: true })
}

export function isReturningVisit(
  lastVisitDate: string | null,
  today: string
): boolean {
  return lastVisitDate !== null && lastVisitDate !== today
}

function countReturningVisit(): void {
  const today = new Date().toDateString()
  let lastVisitDate: string | null = null
  try {
    lastVisitDate = localStorage.getItem(LAST_VISIT_STORAGE_KEY)
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, today)
  } catch {
    /* storage unavailable: count no return visit */
  }
  if (isReturningVisit(lastVisitDate, today)) {
    countEvent(AnalyticsEvent.RETURNING_VISIT)
  }
}

export function loadAnalytics(): void {
  if (!isCountAddressValid(ANALYTICS_URL) || isAnalyticsScriptAdded) return
  isAnalyticsScriptAdded = true
  const script = document.createElement('script')
  script.async = true
  script.src = ANALYTICS_SCRIPT_URL
  script.integrity = ANALYTICS_SCRIPT_INTEGRITY
  script.crossOrigin = ANALYTICS_SCRIPT_CROSS_ORIGIN
  script.dataset.goatcounter = ANALYTICS_URL
  script.dataset.goatcounterSettings = ANALYTICS_SCRIPT_SETTINGS
  script.addEventListener('load', () => {
    countPageView(window.location.pathname, window.location.search)
    countReturningVisit()
  })
  document.head.appendChild(script)
}
