import { parseSearchParams, stringifySearchParams } from '@/lib/searchParams'
import { describe, expect, it } from 'vitest'

describe('searchParams', () => {
  it.each([
    'housing',
    '"housing"',
    '"public flats" tax',
    '2024',
    '"2024"',
    '-housing',
    'true',
    'x-ray',
  ])('round-trips the words %s', (words) => {
    const searchString = stringifySearchParams({ q: words })

    expect(parseSearchParams(searchString)).toEqual({ q: words })
  })

  it('writes a number as its digits', () => {
    expect(stringifySearchParams({ parliament: 15 })).toBe('?parliament=15')
  })

  it('drops undefined values', () => {
    expect(stringifySearchParams({ q: 'tax', person: undefined })).toBe(
      '?q=tax'
    )
  })

  it('returns an empty string when nothing is left', () => {
    expect(stringifySearchParams({ q: undefined })).toBe('')
  })

  it('writes quote marks without a backslash', () => {
    expect(stringifySearchParams({ q: '"housing"' })).toBe('?q=%22housing%22')
  })

  it('keeps a number as a string when reading', () => {
    expect(parseSearchParams('?q=2024&parliament=15')).toEqual({
      q: '2024',
      parliament: '15',
    })
  })

  it('reads an old link with escaped quote marks', () => {
    expect(parseSearchParams('?q=%22%5C%22housing%5C%22%22')).toEqual({
      q: '"housing"',
    })
  })

  it('reads an old link that wrapped a number in quote marks', () => {
    expect(parseSearchParams('?q=%222024%22')).toEqual({ q: '2024' })
  })
})
