import {
  FIRST_SITTING_DATE,
  SEARCH_DATE_OUT_OF_RANGE_ERROR,
} from '@/constants/search/constants'

const SEARCH_TOKEN_PATTERN = /(-?)"([^"]*)"?|[^\s"]+/g
const CURLY_QUOTES = /[“”]/g
const QUOTE = '"'
const WORD_CHARACTER = /[\p{L}\p{N}]/u
const WORD_EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu
const LETTER = /\p{L}/gu
const LOWERCASE_LETTER = /\p{Ll}/u
const WHITESPACE = /\s/
const QUOTE_CHARACTERS = /["“”]/
const EXCLUDED_PREFIX = '-'
const OR_OPERATOR = 'OR'
const NOT_OPERATOR = 'NOT'
const OPERATOR_WORDS = new Set([OR_OPERATOR, 'AND', NOT_OPERATOR, 'BUT'])
const EXCLUDING_SYMBOL = '%'
const SAME_PARAGRAPH_CONNECTOR = /^(?:&|w?\/[ps])$/i
const OR_WORD = 'or'
const OPENING_BRACKET = '('
const CLOSING_BRACKET = ')'
const MIN_TITLE_WORD_LETTER_COUNT = 7
const PROVISION_CITATION =
  /(?<![^\s"(])(ss?|art|cl)\.?\s+(\d{1,3}\p{L}{0,3})(?![\p{L}\p{N}])/giu
const PLURAL_SECTION_ABBREVIATION = 'ss'
const ARTICLE_ABBREVIATION = 'art'
const CLAUSE_ABBREVIATION = 'cl'
const SECTION_WORD = 'section'
const PLURAL_SECTION_WORD = 'sections'
const ARTICLE_WORD = 'article'
const CLAUSE_WORD = 'clause'
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

export interface SearchQueryTerm {
  words: string[]
  isQuoted: boolean
  isExcluded: boolean
}

function getWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) => word.replace(WORD_EDGE, ''))
    .filter((word) => word !== '')
}

function getProvisionWord(abbreviation: string): string {
  switch (abbreviation.toLowerCase()) {
    case PLURAL_SECTION_ABBREVIATION:
      return PLURAL_SECTION_WORD
    case ARTICLE_ABBREVIATION:
      return ARTICLE_WORD
    case CLAUSE_ABBREVIATION:
      return CLAUSE_WORD
    default:
      return SECTION_WORD
  }
}

function isInsideQuotes(text: string, position: number): boolean {
  return (text.slice(0, position).split(QUOTE).length - 1) % 2 === 1
}

function getQueryToParse(query: string): string {
  const straightQuotedQuery = query.replace(CURLY_QUOTES, QUOTE)
  return straightQuotedQuery.replace(
    PROVISION_CITATION,
    (_citation, abbreviation: string, number: string, position: number) => {
      const spelledOutCitation = `${getProvisionWord(abbreviation)} ${number}`
      return isInsideQuotes(straightQuotedQuery, position)
        ? spelledOutCitation
        : `${QUOTE}${spelledOutCitation}${QUOTE}`
    }
  )
}

function isQueryATitleInCapitals(query: string): boolean {
  return (
    !LOWERCASE_LETTER.test(query) &&
    getWords(query).some(
      (word) => (word.match(LETTER) ?? []).length >= MIN_TITLE_WORD_LETTER_COUNT
    )
  )
}

function isClosingBracket(token: string): boolean {
  return (
    token.endsWith(CLOSING_BRACKET) &&
    token.split(OPENING_BRACKET).length < token.split(CLOSING_BRACKET).length
  )
}

function isAtWordStart(text: string, position: number): boolean {
  return position === 0 || WHITESPACE.test(text[position - 1])
}

// Port of the term reading in api/utils/search_query.py (_SearchQueryParser and _get_operand_terms). Keep the two in step.
export function getSearchQueryTerms(query: string): SearchQueryTerm[] {
  const isOperatorWordRead = !isQueryATitleInCapitals(query)
  const queryToParse = getQueryToParse(query)
  const terms: SearchQueryTerm[] = []
  let isBracketOpen = false
  let isBracketExcluded = false
  let isExclusionPending = false

  function addTerm(words: string[], isQuoted: boolean, isExcluded: boolean) {
    if (words.length === 0) return
    const isTermExcluded = isExcluded !== isExclusionPending
    terms.push({
      words,
      isQuoted,
      isExcluded:
        isBracketOpen && isBracketExcluded ? !isTermExcluded : isTermExcluded,
    })
    isExclusionPending = false
  }

  function readBareToken(bareToken: string, isExcluded: boolean) {
    if (isOperatorWordRead && OPERATOR_WORDS.has(bareToken)) {
      if (!isExcluded && bareToken === NOT_OPERATOR) {
        isExclusionPending = !isExclusionPending
      }
      return
    }
    if (bareToken === EXCLUDING_SYMBOL) {
      isExclusionPending = !isExclusionPending
      return
    }
    if (SAME_PARAGRAPH_CONNECTOR.test(bareToken)) return
    const words = getWords(bareToken)
    if (words[0]?.toLowerCase() === OR_WORD) return
    addTerm(words, false, isExcluded)
  }

  function readUnquotedToken(token: string, isTokenAtWordStart: boolean) {
    // A hyphen alone is punctuation; only a hyphen attached to the next word excludes it
    const isExcluded =
      token.startsWith(EXCLUDED_PREFIX) && token !== EXCLUDED_PREFIX
    const bareToken = token.startsWith(EXCLUDED_PREFIX) ? token.slice(1) : token
    if (
      isTokenAtWordStart &&
      !isBracketOpen &&
      bareToken.startsWith(OPENING_BRACKET)
    ) {
      isBracketOpen = true
      isBracketExcluded = isExcluded !== isExclusionPending
      isExclusionPending = false
      readUnquotedToken(bareToken.slice(OPENING_BRACKET.length), false)
      return
    }
    if (!isBracketOpen || !isClosingBracket(bareToken)) {
      readBareToken(bareToken, isExcluded)
      return
    }
    readBareToken(bareToken.slice(0, -CLOSING_BRACKET.length), isExcluded)
    isBracketOpen = false
  }

  for (const match of queryToParse.matchAll(SEARCH_TOKEN_PATTERN)) {
    const [token, excludedPrefix, quotedText] = match
    if (quotedText !== undefined) {
      addTerm(getWords(quotedText), true, excludedPrefix === EXCLUDED_PREFIX)
    } else {
      readUnquotedToken(token, isAtWordStart(queryToParse, match.index))
    }
  }
  return terms
}

// Port of is_query_only_excluded_words in api/utils/search_query.py. Keep the two in step.
export function isQueryOnlyExcludedWords(query: string): boolean {
  const terms = getSearchQueryTerms(query)
  return terms.length > 0 && terms.every((term) => term.isExcluded)
}

export function getSingleUnquotedWord(query: string): string | undefined {
  if (
    WHITESPACE.test(query) ||
    QUOTE_CHARACTERS.test(query) ||
    query.startsWith(EXCLUDED_PREFIX) ||
    query.toLowerCase() === OR_WORD ||
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

export function hasSearchOperator(query: string): boolean {
  const isOperatorWordRead = !isQueryATitleInCapitals(query)
  return (
    QUOTE_CHARACTERS.test(query) ||
    query
      .split(/\s+/)
      .some(
        (word) =>
          word.startsWith(EXCLUDED_PREFIX) ||
          word === EXCLUDING_SYMBOL ||
          (isOperatorWordRead &&
            (word === OR_OPERATOR || word === NOT_OPERATOR))
      )
  )
}

export function getTrailingYear(
  query: string,
  currentYear: number
): { otherWords: string; year: string } | undefined {
  const words = query.split(/\s+/).filter((word) => word !== '')
  if (words.length < 2 || hasSearchOperator(query)) return undefined
  const otherWords = words.slice(0, -1)
  const year = words[words.length - 1]
  const wordBeforeYear = otherWords[otherWords.length - 1]
  if (
    !isSittingYear(year, currentYear) ||
    MONTH_NAMES.has(wordBeforeYear.toLowerCase()) ||
    otherWords.some((word) => isSittingYear(word, currentYear))
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
