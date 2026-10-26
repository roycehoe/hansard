import { SpeechLinkStatus } from '@/constants/reports/enums'
import { isLinkedSpeech } from '@/lib/linkedSpeech'
import { describe, expect, it } from 'vitest'

describe('isLinkedSpeech', () => {
  it('matches the ordinal an s link landed on', () => {
    const link = { status: SpeechLinkStatus.MOVED, ordinal: 7 }
    expect(isLinkedSpeech(7, link, '')).toBe(true)
    expect(isLinkedSpeech(8, link, '')).toBe(false)
  })

  it('matches a paragraph anchor in the hash', () => {
    expect(isLinkedSpeech(12, null, '#s12')).toBe(true)
    expect(isLinkedSpeech(1, null, '#s12')).toBe(false)
  })

  it('matches nothing without a link', () => {
    expect(isLinkedSpeech(12, null, '')).toBe(false)
  })
})
