import { getCountedPath, isReturningVisit } from '@/lib/analytics'
import { describe, expect, it } from 'vitest'

describe('getCountedPath', () => {
  it('keeps s and q the first time a report path is counted', () => {
    expect(getCountedPath('/reports/a-report', '?s=4&q=abc&x=1', false)).toBe(
      '/reports/a-report?s=4&q=abc'
    )
  })

  it('drops s and q once the path has been counted', () => {
    expect(getCountedPath('/reports/a-report', '?s=9&q=def', true)).toBe(
      '/reports/a-report'
    )
  })

  it('leaves other paths without a search string', () => {
    expect(getCountedPath('/search', '?q=housing', false)).toBe('/search')
  })
})

describe('isReturningVisit', () => {
  it('is false on the first visit', () => {
    expect(isReturningVisit(null, 'Sat Nov 07 2026')).toBe(false)
  })

  it('is false on a second visit the same day', () => {
    expect(isReturningVisit('Sat Nov 07 2026', 'Sat Nov 07 2026')).toBe(false)
  })

  it('is true when the last visit was on an earlier day', () => {
    expect(isReturningVisit('Fri Nov 06 2026', 'Sat Nov 07 2026')).toBe(true)
  })
})
