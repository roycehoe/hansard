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

export function getSearchDateError(
  date: string,
  today: string
): string | undefined {
  if (date === '') return undefined
  return date < FIRST_SITTING_DATE || date > today
    ? SEARCH_DATE_OUT_OF_RANGE_ERROR
    : undefined
}
