import { shouldMoveFocusToPageHeading } from '@/lib/navigationFocus'
import { describe, expect, it } from 'vitest'

describe('shouldMoveFocusToPageHeading', () => {
  it('moves focus when the path changed and nothing links into the page', () => {
    expect(
      shouldMoveFocusToPageHeading({
        pathChanged: true,
        hash: '',
        searchParams: {},
      })
    ).toBe(true)
  })

  it('keeps focus when only the search changed', () => {
    expect(
      shouldMoveFocusToPageHeading({
        pathChanged: false,
        hash: '',
        searchParams: { q: 'water' },
      })
    ).toBe(false)
  })

  it('leaves the scroll to a paragraph anchor alone', () => {
    expect(
      shouldMoveFocusToPageHeading({
        pathChanged: true,
        hash: 's12',
        searchParams: {},
      })
    ).toBe(false)
  })

  it('leaves the scroll to a linked paragraph alone', () => {
    expect(
      shouldMoveFocusToPageHeading({
        pathChanged: true,
        hash: '',
        searchParams: { s: 12, q: 'water' },
      })
    ).toBe(false)
  })
})
