import {
  buildHighlightPattern,
  buildWordStartPattern,
  parseHighlightTerms,
  splitByHighlight,
} from '@/lib/highlight'
import { describe, expect, it } from 'vitest'

describe('parseHighlightTerms', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(parseHighlightTerms('')).toEqual([])
    expect(parseHighlightTerms('   ')).toEqual([])
  })

  it('keeps plain words as typed', () => {
    expect(parseHighlightTerms('budget deficit')).toEqual(['budget', 'deficit'])
  })

  it('keeps a hyphen inside a word', () => {
    expect(parseHighlightTerms('long-term housing')).toEqual([
      'long-term',
      'housing',
    ])
  })

  it('drops the OR operator', () => {
    expect(parseHighlightTerms('budget OR deficit')).toEqual([
      'budget',
      'deficit',
    ])
  })

  it('drops stop words and one-letter words', () => {
    expect(parseHighlightTerms('the budget of a x')).toEqual(['budget'])
  })

  it('drops a word excluded with a leading hyphen', () => {
    expect(parseHighlightTerms('budget -deficit')).toEqual(['budget'])
  })

  it('drops a lone hyphen', () => {
    expect(parseHighlightTerms('budget -')).toEqual(['budget'])
  })

  it('reads a spaced hyphen as punctuation, not an exclusion', () => {
    expect(parseHighlightTerms('HEAD S - MINISTRY OF MANPOWER')).toEqual([
      'HEAD',
      'MINISTRY',
      'MANPOWER',
    ])
    expect(parseHighlightTerms('-housing budget')).toEqual(['budget'])
  })

  it('splits a quoted phrase into separately quoted words', () => {
    expect(parseHighlightTerms('"public housing"')).toEqual([
      '"public"',
      '"housing"',
    ])
  })

  it('reads curly quotes like straight ones', () => {
    expect(parseHighlightTerms('“public housing”')).toEqual([
      '"public"',
      '"housing"',
    ])
  })

  it('reads a quote that is never closed', () => {
    expect(parseHighlightTerms('"public housing')).toEqual([
      '"public"',
      '"housing"',
    ])
  })

  it('drops stop words and OR inside a quoted phrase', () => {
    expect(parseHighlightTerms('"the budget OR deficit"')).toEqual([
      '"budget"',
      '"deficit"',
    ])
  })

  it('returns nothing for a quoted phrase made only of dropped words', () => {
    expect(parseHighlightTerms('"this OR that"')).toEqual([])
    expect(parseHighlightTerms('""')).toEqual([])
  })

  it('keeps the word and the quoted phrase after a lone hyphen', () => {
    expect(parseHighlightTerms('grants - budget')).toEqual(['grants', 'budget'])
    expect(parseHighlightTerms('tax - "public housing"')).toEqual([
      'tax',
      '"public"',
      '"housing"',
    ])
  })

  it('drops an excluded quoted phrase', () => {
    expect(parseHighlightTerms('budget -"public housing"')).toEqual(['budget'])
  })

  it('reads a quote glued to a word as a new term', () => {
    expect(parseHighlightTerms('foo"bar baz"')).toEqual([
      'foo',
      '"bar"',
      '"baz"',
    ])
  })

  it('mixes plain and quoted terms in order', () => {
    expect(parseHighlightTerms('tax "public housing" OR levy')).toEqual([
      'tax',
      '"public"',
      '"housing"',
      'levy',
    ])
  })

  it('removes repeats regardless of case and keeps the first spelling', () => {
    expect(parseHighlightTerms('Budget budget BUDGET')).toEqual(['Budget'])
  })

  it('treats a plain word and the same quoted word as different terms', () => {
    expect(parseHighlightTerms('housing "housing"')).toEqual([
      'housing',
      '"housing"',
    ])
  })

  it('keeps words with accents', () => {
    expect(parseHighlightTerms('café')).toEqual(['café'])
  })
})

describe('buildHighlightPattern', () => {
  it('returns undefined when there are no words', () => {
    expect(buildHighlightPattern([])).toBeUndefined()
  })

  it('marks a whole word and ignores case', () => {
    const pattern = buildHighlightPattern(['budget'])
    expect(splitByHighlight('The Budget is big', pattern)).toEqual([
      { text: 'The ', isMarked: false },
      { text: 'Budget', isMarked: true },
      { text: ' is big', isMarked: false },
    ])
  })

  it('marks every match', () => {
    const pattern = buildHighlightPattern(['budget', 'deficit'])
    expect(splitByHighlight('budget and Deficit and budget', pattern)).toEqual([
      { text: 'budget', isMarked: true },
      { text: ' and ', isMarked: false },
      { text: 'Deficit', isMarked: true },
      { text: ' and ', isMarked: false },
      { text: 'budget', isMarked: true },
    ])
  })

  it('does not mark part of a longer word', () => {
    const pattern = buildHighlightPattern(['budget'])
    expect(splitByHighlight('budgets and subbudget', pattern)).toEqual([
      { text: 'budgets and subbudget', isMarked: false },
    ])
  })

  it('does not mark inside a word with an accent', () => {
    const pattern = buildHighlightPattern(['caf'])
    expect(splitByHighlight('café', pattern)).toEqual([
      { text: 'café', isMarked: false },
    ])
  })

  it('marks a word next to punctuation', () => {
    const pattern = buildHighlightPattern(['budget'])
    expect(splitByHighlight('(budget), please.', pattern)).toEqual([
      { text: '(', isMarked: false },
      { text: 'budget', isMarked: true },
      { text: '), please.', isMarked: false },
    ])
  })

  it('takes the whole of a word that starts with another word', () => {
    const pattern = buildHighlightPattern(['tax', 'taxation'])
    expect(splitByHighlight('taxation and tax', pattern)).toEqual([
      { text: 'taxation', isMarked: true },
      { text: ' and ', isMarked: false },
      { text: 'tax', isMarked: true },
    ])
  })

  it('treats regex characters in a word as plain text', () => {
    const pattern = buildHighlightPattern(['a.b', 'c++'])
    expect(splitByHighlight('axb a.b c++', pattern)).toEqual([
      { text: 'axb ', isMarked: false },
      { text: 'a.b', isMarked: true },
      { text: ' ', isMarked: false },
      { text: 'c++', isMarked: true },
    ])
  })
})

describe('buildWordStartPattern', () => {
  it('returns undefined when there are no words', () => {
    expect(buildWordStartPattern([])).toBeUndefined()
  })

  it('marks the whole word that starts with the typed letters', () => {
    const pattern = buildWordStartPattern(['hen'])
    expect(splitByHighlight('Mr Henderson when', pattern)).toEqual([
      { text: 'Mr ', isMarked: false },
      { text: 'Henderson', isMarked: true },
      { text: ' when', isMarked: false },
    ])
  })
})

describe('splitByHighlight', () => {
  it('returns the whole text unmarked without a pattern', () => {
    expect(splitByHighlight('Some text', undefined)).toEqual([
      { text: 'Some text', isMarked: false },
    ])
  })

  it('keeps marks in step when the text starts and ends with a match', () => {
    const pattern = buildHighlightPattern(['tax'])
    expect(splitByHighlight('tax and tax', pattern)).toEqual([
      { text: 'tax', isMarked: true },
      { text: ' and ', isMarked: false },
      { text: 'tax', isMarked: true },
    ])
  })

  it('returns the text unmarked when nothing matches', () => {
    const pattern = buildHighlightPattern(['tax'])
    expect(splitByHighlight('nothing here', pattern)).toEqual([
      { text: 'nothing here', isMarked: false },
    ])
  })
})
