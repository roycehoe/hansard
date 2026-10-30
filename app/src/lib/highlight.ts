import { HIGHLIGHT_STOP_WORDS } from '@/constants/reports/constants'

const MIN_HIGHLIGHT_TERM_LENGTH = 2
const HIGHLIGHT_TERM_PATTERN = /(-?)["“”]([^"“”]*)["“”]?|[^\s"“”]+/g
const QUOTE = '"'
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g
const WORD_CHARACTER = '[\\p{L}\\p{N}_]'
const OR_OPERATOR = 'OR'
const EXCLUDED_WORD_PREFIX = '-'

interface HighlightSegment {
  text: string
  isMarked: boolean
}

function isHighlightableWord(word: string): boolean {
  return (
    word !== OR_OPERATOR &&
    !word.startsWith(EXCLUDED_WORD_PREFIX) &&
    word.length >= MIN_HIGHLIGHT_TERM_LENGTH &&
    !HIGHLIGHT_STOP_WORDS.has(word.toLowerCase())
  )
}

export function parseHighlightTerms(query: string): string[] {
  const terms = Array.from(query.matchAll(HIGHLIGHT_TERM_PATTERN)).flatMap(
    ([token, excludedPrefix, quotedWords]) => {
      // A hyphen alone is punctuation, as in api/utils/search_query.py; only a hyphen attached to the next word excludes it
      if (quotedWords === undefined) {
        return isHighlightableWord(token) ? [token] : []
      }
      if (excludedPrefix === EXCLUDED_WORD_PREFIX) return []
      return quotedWords
        .split(/\s+/)
        .filter(isHighlightableWord)
        .map((word) => `${QUOTE}${word}${QUOTE}`)
    }
  )
  const seenTerms = new Set<string>()
  return terms.filter((term) => {
    const lowerCaseTerm = term.toLowerCase()
    if (seenTerms.has(lowerCaseTerm)) return false
    seenTerms.add(lowerCaseTerm)
    return true
  })
}

function joinEscapedAlternatives(words: string[]): string {
  return words
    .map((word) => word.replace(REGEX_SPECIAL_CHARACTERS, '\\$&'))
    .join('|')
}

export function buildHighlightPattern(words: string[]): RegExp | undefined {
  if (words.length === 0) return undefined
  const alternatives = joinEscapedAlternatives(words)
  return new RegExp(
    `((?<!${WORD_CHARACTER})(?:${alternatives})(?!${WORD_CHARACTER}))`,
    'iu'
  )
}

export function buildWordStartPattern(words: string[]): RegExp | undefined {
  if (words.length === 0) return undefined
  const alternatives = joinEscapedAlternatives(words)
  return new RegExp(
    `((?<!${WORD_CHARACTER})(?:${alternatives})${WORD_CHARACTER}*)`,
    'iu'
  )
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
