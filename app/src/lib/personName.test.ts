import { getPersonNameMatchRank } from '@/lib/personName'
import { describe, expect, it } from 'vitest'

describe('getPersonNameMatchRank', () => {
  it('matches printed initials across punctuation', () => {
    expect(getPersonNameMatchRank('J.B. Jeyaretnam', ['J B Jeyaretnam'])).toBe(
      0
    )
  })

  it('matches a stored label held in the variants', () => {
    expect(
      getPersonNameMatchRank('Goode W.A.C.', ['William Goode', 'Goode W.A.C.'])
    ).toBe(0)
  })

  it('keeps Haji as a name part', () => {
    expect(
      getPersonNameMatchRank('Haji', ['Mohd Ariff Bin Suradi, Haji'])
    ).toBe(2)
  })

  it('matches Dr Tan Cheng Bock to Tan Cheng Bock', () => {
    expect(
      getPersonNameMatchRank('Dr Tan Cheng Bock', ['Tan Cheng Bock'])
    ).toBe(0)
  })

  it('matches Dr Lee with or without a title in the stored name', () => {
    expect(getPersonNameMatchRank('Dr Lee', ['Lee Siew Choh'])).toBe(2)
    expect(
      getPersonNameMatchRank('Dr Lee', ['Lee Siew Choh', 'Lee Siew Choh, Dr'])
    ).toBe(2)
  })

  it('matches nobody on a title alone', () => {
    expect(getPersonNameMatchRank('dr', ['Lee Siew Choh, Dr'])).toBeUndefined()
  })

  it('keeps Bin as a name part', () => {
    expect(getPersonNameMatchRank('Bin', ['Mohd Ariff Bin Suradi'])).toBe(2)
    expect(
      getPersonNameMatchRank('Haji', ['Mohd Ariff Bin Suradi'])
    ).toBeUndefined()
  })

  it('returns undefined for an empty query', () => {
    expect(getPersonNameMatchRank('', ['Lee Siew Choh'])).toBeUndefined()
    expect(getPersonNameMatchRank('  ', ['Lee Siew Choh'])).toBeUndefined()
  })

  it('ranks exact, same words, then prefixes', () => {
    expect(getPersonNameMatchRank('Tan Cheng Bock', ['Tan Cheng Bock'])).toBe(0)
    expect(getPersonNameMatchRank('Bock Tan Cheng', ['Tan Cheng Bock'])).toBe(1)
    expect(getPersonNameMatchRank('Tan Ch', ['Tan Cheng Bock'])).toBe(2)
  })

  it('takes the lowest rank over all names', () => {
    expect(getPersonNameMatchRank('Lee', ['Lee Siew Choh', 'Lee'])).toBe(0)
  })
})
