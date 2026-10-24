const SEARCH_TOKEN_PATTERN = /(-?)"([^"]*)"?|[^\s"]+/g
const CURLY_QUOTES = /[“”]/g
const QUOTE = '"'
const WORD_CHARACTER = /[\p{L}\p{N}]/u
const EXCLUDED_PREFIX = '-'
const OR_OPERATOR = 'or'

// Port of is_query_only_excluded_words in api/utils/search_query.py. Keep the two in step.
export function isQueryOnlyExcludedWords(query: string): boolean {
  const termExclusions: boolean[] = []
  let isNextTermExcluded = false
  for (const [token, excludedPrefix, quotedWords] of query
    .replace(CURLY_QUOTES, QUOTE)
    .matchAll(SEARCH_TOKEN_PATTERN)) {
    if (quotedWords !== undefined) {
      if (WORD_CHARACTER.test(quotedWords)) {
        termExclusions.push(
          isNextTermExcluded || excludedPrefix === EXCLUDED_PREFIX
        )
      }
      isNextTermExcluded = false
      continue
    }
    if (token === EXCLUDED_PREFIX) {
      isNextTermExcluded = true
      continue
    }
    const isExcluded = isNextTermExcluded || token.startsWith(EXCLUDED_PREFIX)
    isNextTermExcluded = false
    const bareToken = token.startsWith(EXCLUDED_PREFIX) ? token.slice(1) : token
    if (bareToken.toLowerCase() === OR_OPERATOR) continue
    if (WORD_CHARACTER.test(bareToken)) termExclusions.push(isExcluded)
  }
  return termExclusions.length > 0 && termExclusions.every(Boolean)
}
