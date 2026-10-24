import { isQueryOnlyExcludedWords } from '@/lib/searchQuery'
import { describe, expect, it } from 'vitest'

describe('isQueryOnlyExcludedWords', () => {
  it('is true when every term has a minus sign', () => {
    expect(isQueryOnlyExcludedWords('-housing')).toBe(true)
    expect(isQueryOnlyExcludedWords('-housing -"public flats"')).toBe(true)
    expect(isQueryOnlyExcludedWords('- housing')).toBe(true)
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

  it('is false when there is no term at all', () => {
    expect(isQueryOnlyExcludedWords('')).toBe(false)
    expect(isQueryOnlyExcludedWords('-')).toBe(false)
    expect(isQueryOnlyExcludedWords('-,')).toBe(false)
    expect(isQueryOnlyExcludedWords('-OR')).toBe(false)
    expect(isQueryOnlyExcludedWords('""')).toBe(false)
  })
})
