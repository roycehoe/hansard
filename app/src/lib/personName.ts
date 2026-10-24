import type { PersonData } from '@/api/people/getAllPersons'

const NON_WORD_RUN = /[^\p{L}\p{N}]+/gu
const INITIAL_RUN = /(?<![\p{L}\p{N}])\p{L}(?: \p{L})+(?![\p{L}\p{N}])/gu
const WORD_SEPARATOR = ' '
const PERSON_TITLE_WORDS = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'mdm',
  'madam',
  'dr',
  'prof',
  'assoc',
  'encik',
  'inche',
])
const EXACT_RANK = 0
const SAME_WORDS_RANK = 1
const WORD_PREFIXES_RANK = 2
const ACRONYM_RANK = 3
const ACRONYM_QUERY_WORD = /^\p{L}{3,4}$/u

function getTitleStrippedWords(words: string[]): string[] {
  let start = 0
  let end = words.length
  while (start < end && PERSON_TITLE_WORDS.has(words[start])) start += 1
  while (end > start && PERSON_TITLE_WORDS.has(words[end - 1])) end -= 1
  return words.slice(start, end)
}

interface NormalisedName {
  words: string[]
  initialRuns: Set<string>
}

function joinInitialRun(run: string): string {
  return run.split(WORD_SEPARATOR).join('')
}

function getSpacedName(name: string): string {
  return name.toLowerCase().replace(NON_WORD_RUN, WORD_SEPARATOR).trim()
}

function getNormalisedName(name: string): NormalisedName {
  const spaced = getSpacedName(name)
  return {
    words: getTitleStrippedWords(
      spaced
        .replace(INITIAL_RUN, joinInitialRun)
        .split(WORD_SEPARATOR)
        .filter((word) => word !== '')
    ),
    initialRuns: new Set(
      Array.from(spaced.matchAll(INITIAL_RUN), ([run]) => joinInitialRun(run))
    ),
  }
}

function isSpeltByFirstLetters(
  initialRun: string,
  nameWords: string[]
): boolean {
  const letters = [...initialRun]
  return nameWords.some((_, start) =>
    letters.every((letter, offset) =>
      nameWords[start + offset]?.startsWith(letter)
    )
  )
}

function isQueryWordMatched(
  queryWord: string,
  initialRuns: Set<string>,
  nameWords: string[]
): boolean {
  return (
    nameWords.some((nameWord) => nameWord.startsWith(queryWord)) ||
    (initialRuns.has(queryWord) && isSpeltByFirstLetters(queryWord, nameWords))
  )
}

function getNameMatchRank(
  query: NormalisedName,
  nameWords: string[]
): number | undefined {
  const queryWords = query.words
  if (queryWords.length === 0) return undefined
  if (queryWords.join(WORD_SEPARATOR) === nameWords.join(WORD_SEPARATOR)) {
    return EXACT_RANK
  }
  if (
    [...queryWords].sort().join(WORD_SEPARATOR) ===
    [...nameWords].sort().join(WORD_SEPARATOR)
  ) {
    return SAME_WORDS_RANK
  }
  if (
    queryWords.every((queryWord) =>
      isQueryWordMatched(queryWord, query.initialRuns, nameWords)
    )
  ) {
    return WORD_PREFIXES_RANK
  }
  return undefined
}

export function getPersonNameMatchRank(
  query: string,
  names: string[]
): number | undefined {
  const normalisedQuery = getNormalisedName(query)
  const ranks = names
    .map((name) =>
      getNameMatchRank(normalisedQuery, getNormalisedName(name).words)
    )
    .filter((rank) => rank !== undefined)
  return ranks.length === 0 ? undefined : Math.min(...ranks)
}

function getAcronym(name: string): string {
  return getTitleStrippedWords(
    getSpacedName(name)
      .split(WORD_SEPARATOR)
      .filter((word) => word !== '')
  )
    .map((word) => [...word][0])
    .join('')
}

function getPersonNames(person: PersonData): string[] {
  return [person.canonical_name, ...person.name_variants]
}

// Acronyms such as "lky" count only when the query matches nobody by words,
// so a query that names someone keeps exactly its word matches.
export function getPersonNameMatches(
  query: string,
  persons: PersonData[]
): { person: PersonData; rank: number }[] {
  const wordMatches = persons.flatMap((person) => {
    const rank = getPersonNameMatchRank(query, getPersonNames(person))
    return rank === undefined ? [] : [{ person, rank }]
  })
  if (wordMatches.length > 0) return wordMatches
  const queryWords = getNormalisedName(query).words
  if (queryWords.length !== 1 || !ACRONYM_QUERY_WORD.test(queryWords[0])) {
    return []
  }
  return persons
    .filter((person) =>
      getPersonNames(person).some((name) => getAcronym(name) === queryWords[0])
    )
    .map((person) => ({ person, rank: ACRONYM_RANK }))
}
