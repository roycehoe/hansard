import { HIGHLIGHT_STOP_WORDS } from '@/constants/reports/constants'
import { getSearchQueryTerms } from '@/lib/searchQuery'

const MIN_HIGHLIGHT_TERM_LENGTH = 2
const QUOTE = '"'
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g
const WORD_CHARACTER = '[\\p{L}\\p{N}_]'

interface HighlightSegment {
  text: string
  isMarked: boolean
}

function isHighlightableWord(word: string): boolean {
  return (
    word.length >= MIN_HIGHLIGHT_TERM_LENGTH &&
    !HIGHLIGHT_STOP_WORDS.has(word.toLowerCase())
  )
}

export function parseHighlightTerms(query: string): string[] {
  const terms = getSearchQueryTerms(query)
    .filter((term) => !term.isExcluded)
    .flatMap((term) => {
      const words = term.words.filter(isHighlightableWord)
      return term.isQuoted
        ? words.map((word) => `${QUOTE}${word}${QUOTE}`)
        : words
    })
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
