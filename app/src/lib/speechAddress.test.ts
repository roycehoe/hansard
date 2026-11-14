// @vitest-environment jsdom
import { replaceAddressWithSpeechLink } from '@/lib/speechAddress'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const REPORT_PATH = '/reports/motion-3008'
const ROUTER_STATE = { __TSR_index: 4, __TSR_key: 'abc', key: 'abc' }

function readAddress(): string {
  const { pathname, search, hash } = window.location
  return `${pathname}${search}${hash}`
}

beforeEach(() => {
  History.prototype.replaceState.call(
    window.history,
    ROUTER_STATE,
    '',
    REPORT_PATH
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (window.history as Partial<History>).replaceState
})

describe('replaceAddressWithSpeechLink', () => {
  it('puts the paragraph link in the address', () => {
    replaceAddressWithSpeechLink(
      `https://openhansard.sg${REPORT_PATH}?s=980&q=mr+deputy+speaker`
    )
    expect(readAddress()).toBe(`${REPORT_PATH}?s=980&q=mr+deputy+speaker`)
  })

  it('takes a link with no anchor as a fragment', () => {
    replaceAddressWithSpeechLink(`https://openhansard.sg${REPORT_PATH}#s12`)
    expect(readAddress()).toBe(`${REPORT_PATH}#s12`)
  })

  it('keeps the history entry and its router state', () => {
    const lengthBefore = window.history.length
    replaceAddressWithSpeechLink(`https://openhansard.sg${REPORT_PATH}?s=2&q=a`)
    replaceAddressWithSpeechLink(`https://openhansard.sg${REPORT_PATH}?s=3&q=b`)
    expect(window.history.length).toBe(lengthBefore)
    expect(window.history.state).toEqual(ROUTER_STATE)
  })

  it('goes around a wrapped replaceState so the router never hears', () => {
    const wrappedReplaceState = vi.fn()
    window.history.replaceState = wrappedReplaceState
    replaceAddressWithSpeechLink(`https://openhansard.sg${REPORT_PATH}?s=2&q=a`)
    expect(wrappedReplaceState).not.toHaveBeenCalled()
    expect(readAddress()).toBe(`${REPORT_PATH}?s=2&q=a`)
  })

  it('skips the replace when the address already holds the link', () => {
    const link = `https://openhansard.sg${REPORT_PATH}?s=2&q=a`
    replaceAddressWithSpeechLink(link)
    const replaceSpy = vi.spyOn(History.prototype, 'replaceState')
    replaceAddressWithSpeechLink(link)
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  it('keeps the address when the browser refuses the replace', () => {
    vi.spyOn(History.prototype, 'replaceState').mockImplementation(() => {
      throw new DOMException('Too many calls', 'SecurityError')
    })
    expect(() =>
      replaceAddressWithSpeechLink(
        `https://openhansard.sg${REPORT_PATH}?s=2&q=a`
      )
    ).not.toThrow()
    expect(readAddress()).toBe(REPORT_PATH)
  })
})
