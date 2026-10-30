import {
  getSearchDateError,
  getSingleUnquotedWord,
  isQueryOnlyExcludedWords,
} from '@/lib/searchQuery'
import { describe, expect, it } from 'vitest'

describe('isQueryOnlyExcludedWords', () => {
  it('is true when every term has a minus sign', () => {
    expect(isQueryOnlyExcludedWords('-housing')).toBe(true)
    expect(isQueryOnlyExcludedWords('-housing -"public flats"')).toBe(true)
    expect(isQueryOnlyExcludedWords('-housing OR -flats')).toBe(true)
    expect(isQueryOnlyExcludedWords('-“public flats”')).toBe(true)
  })

  it('is false when a term has no minus sign', () => {
    expect(isQueryOnlyExcludedWords('housing')).toBe(false)
    expect(isQueryOnlyExcludedWords('tax -housing')).toBe(false)
    expect(isQueryOnlyExcludedWords('-housing OR tax')).toBe(false)
    expect(isQueryOnlyExcludedWords('-housing "public flats"')).toBe(false)
    expect(isQueryOnlyExcludedWords('x-ray')).toBe(false)
  })

  it('reads a spaced hyphen as punctuation, not an exclusion', () => {
    expect(isQueryOnlyExcludedWords('HEAD S - MINISTRY OF MANPOWER')).toBe(
      false
    )
    expect(isQueryOnlyExcludedWords('-housing')).toBe(true)
  })

  it('is false when there is no term at all', () => {
    expect(isQueryOnlyExcludedWords('')).toBe(false)
    expect(isQueryOnlyExcludedWords('-')).toBe(false)
    expect(isQueryOnlyExcludedWords('-,')).toBe(false)
    expect(isQueryOnlyExcludedWords('-OR')).toBe(false)
    expect(isQueryOnlyExcludedWords('""')).toBe(false)
  })
})

describe('getSingleUnquotedWord', () => {
  it('returns a single bare word as typed', () => {
    expect(getSingleUnquotedWord('housing')).toBe('housing')
    expect(getSingleUnquotedWord('covid-19')).toBe('covid-19')
  })

  it('is undefined for several words, quotes, a minus, OR or no word character', () => {
    expect(getSingleUnquotedWord('public housing')).toBeUndefined()
    expect(getSingleUnquotedWord('"housing"')).toBeUndefined()
    expect(getSingleUnquotedWord('“housing”')).toBeUndefined()
    expect(getSingleUnquotedWord('-house')).toBeUndefined()
    expect(getSingleUnquotedWord('OR')).toBeUndefined()
    expect(getSingleUnquotedWord('or')).toBeUndefined()
    expect(getSingleUnquotedWord('!!')).toBeUndefined()
  })
})

describe('getSearchDateError', () => {
  const today = '2026-10-26'

  it('gives the field message for a date before the first sitting or after today', () => {
    expect(getSearchDateError('0202-01-01', today)).toBe(
      'Use a date from 22 April 1955 to today.'
    )
    expect(getSearchDateError('1955-04-21', today)).toBeDefined()
    expect(getSearchDateError('2026-10-27', today)).toBeDefined()
  })

  it('accepts an empty date and the dates at both ends', () => {
    expect(getSearchDateError('', today)).toBeUndefined()
    expect(getSearchDateError('1955-04-22', today)).toBeUndefined()
    expect(getSearchDateError(today, today)).toBeUndefined()
  })
})
