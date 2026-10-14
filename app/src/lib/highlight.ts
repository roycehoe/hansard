import { HIGHLIGHT_STOP_WORDS } from '@/constants/reports/constants'

const MIN_HIGHLIGHT_TERM_LENGTH = 2
const QUOTE_CHARACTERS = /["“”]/g
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g
const OR_OPERATOR = 'OR'
const EXCLUDED_WORD_PREFIX = '-'

interface HighlightSegment {
  text: string
  isMarked: boolean
}

export function parseHighlightTerms(query: string): string[] {
  const words = query
    .replace(QUOTE_CHARACTERS, ' ')
    .split(/\s+/)
    .filter(
      (word) =>
        word !== OR_OPERATOR &&
        !word.startsWith(EXCLUDED_WORD_PREFIX) &&
        word.length >= MIN_HIGHLIGHT_TERM_LENGTH &&
        !HIGHLIGHT_STOP_WORDS.has(word.toLowerCase())
    )
  const seenWords = new Set<string>()
  return words.filter((word) => {
    const lowerCaseWord = word.toLowerCase()
    if (seenWords.has(lowerCaseWord)) return false
    seenWords.add(lowerCaseWord)
    return true
  })
}

export function buildHighlightPattern(terms: string[]): RegExp | undefined {
  if (terms.length === 0) return undefined
  const alternatives = terms
    .map((term) => term.replace(REGEX_SPECIAL_CHARACTERS, '\\$&'))
    .join('|')
  return new RegExp(`(\\b(?:${alternatives})\\w*)`, 'i')
}

export function splitByHighlight(
  text: string,
  pattern: RegExp | undefined
): HighlightSegment[] {
  if (pattern === undefined) return [{ text, isMarked: false }]
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, isMarked: index % 2 === 1 }))
    .filter((segment) => segment.text !== '')
}
