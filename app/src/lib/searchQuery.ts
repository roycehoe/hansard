import {
  FIRST_SITTING_DATE,
  SEARCH_DATE_OUT_OF_RANGE_ERROR,
} from '@/constants/search/constants'

const SEARCH_TOKEN_PATTERN = /(-?)"([^"]*)"?|[^\s"]+/g
const CURLY_QUOTES = /[“”]/g
const QUOTE = '"'
const WORD_CHARACTER = /[\p{L}\p{N}]/u
const WHITESPACE = /\s/
const QUOTE_CHARACTERS = /["“”]/
const EXCLUDED_PREFIX = '-'
const OR_OPERATOR = 'or'
const YEAR_PATTERN = /^\d{4}$/
const FIRST_SITTING_YEAR = Number(FIRST_SITTING_DATE.slice(0, 4))
const MONTH_NAMES = new Set([
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
])

// Port of is_query_only_excluded_words in api/utils/search_query.py. Keep the two in step.
export function isQueryOnlyExcludedWords(query: string): boolean {
  const termExclusions: boolean[] = []
  for (const [token, excludedPrefix, quotedWords] of query
    .replace(CURLY_QUOTES, QUOTE)
    .matchAll(SEARCH_TOKEN_PATTERN)) {
    if (quotedWords !== undefined) {
      if (WORD_CHARACTER.test(quotedWords)) {
        termExclusions.push(excludedPrefix === EXCLUDED_PREFIX)
      }
      continue
    }
    // A hyphen alone is punctuation; only a hyphen attached to the next word excludes it
    const isExcluded =
      token.startsWith(EXCLUDED_PREFIX) && token !== EXCLUDED_PREFIX
    const bareToken = token.startsWith(EXCLUDED_PREFIX) ? token.slice(1) : token
    if (bareToken.toLowerCase() === OR_OPERATOR) continue
    if (WORD_CHARACTER.test(bareToken)) termExclusions.push(isExcluded)
  }
  return termExclusions.length > 0 && termExclusions.every(Boolean)
}

export function getSingleUnquotedWord(query: string): string | undefined {
  if (
    WHITESPACE.test(query) ||
    QUOTE_CHARACTERS.test(query) ||
    query.startsWith(EXCLUDED_PREFIX) ||
    query.toLowerCase() === OR_OPERATOR ||
    !WORD_CHARACTER.test(query)
  ) {
    return undefined
  }
  return query
}

function isSittingYear(word: string, currentYear: number): boolean {
  if (!YEAR_PATTERN.test(word)) return false
  const year = Number(word)
  return year >= FIRST_SITTING_YEAR && year <= currentYear
}

export function getTrailingYear(
  query: string,
  currentYear: number
): { otherWords: string; year: string } | undefined {
  const words = query.split(/\s+/).filter((word) => word !== '')
  if (words.length < 2 || QUOTE_CHARACTERS.test(query)) return undefined
  const otherWords = words.slice(0, -1)
  const year = words[words.length - 1]
  const wordBeforeYear = otherWords[otherWords.length - 1]
  if (
    !isSittingYear(year, currentYear) ||
    MONTH_NAMES.has(wordBeforeYear.toLowerCase()) ||
    otherWords.some(
      (word) =>
        word.toLowerCase() === OR_OPERATOR ||
        word.startsWith(EXCLUDED_PREFIX) ||
        isSittingYear(word, currentYear)
    )
  ) {
    return undefined
  }
  return { otherWords: otherWords.join(' '), year }
}

export function getSearchDateError(
  date: string,
  today: string
): string | undefined {
  if (date === '') return undefined
  return date < FIRST_SITTING_DATE || date > today
    ? SEARCH_DATE_OUT_OF_RANGE_ERROR
    : undefined
}
