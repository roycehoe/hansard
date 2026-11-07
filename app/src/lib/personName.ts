import type { PersonData } from '@/api/people/getAllPersons'
import { PersonNameSpellingKind } from '@/constants/people/enums'
import type { PersonNameSpellingData } from '@/types/people/interfaces'

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
const OTHER_NAME_SEPARATOR = ', '
const OTHER_SPELLING_LABEL = 'Also spelled'
const OTHER_NAME_LABEL = 'Also printed as'
const OTHER_NAME_LINE_SEPARATOR = '. '

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

function isSameWords(first: string[], second: string[]): boolean {
  return (
    first.join(WORD_SEPARATOR).toLowerCase() ===
    second.join(WORD_SEPARATOR).toLowerCase()
  )
}

function getWordsWithoutName(
  words: string[],
  nameWords: string[]
): string[] | undefined {
  const atStart = words.slice(0, nameWords.length)
  if (isSameWords(atStart, nameWords)) return words.slice(nameWords.length)
  const atEnd = words.slice(-nameWords.length)
  if (isSameWords(atEnd, nameWords)) return words.slice(0, -nameWords.length)
  return undefined
}

export function getNamedPerson(
  query: string,
  persons: PersonData[]
): { person: PersonData; otherWords: string } | undefined {
  const typedWords = query.split(/\s+/).filter((word) => word !== '')
  const firstWordAfterTitles = typedWords.findIndex(
    (word) => !PERSON_TITLE_WORDS.has(getSpacedName(word))
  )
  const words = typedWords.slice(firstWordAfterTitles)
  const [longestMatch] = persons
    .flatMap((person) => {
      const nameWords = person.canonical_name.split(WORD_SEPARATOR)
      const otherWords = getWordsWithoutName(words, nameWords)
      return otherWords === undefined || otherWords.length === 0
        ? []
        : [{ person, nameLength: nameWords.length, otherWords }]
    })
    .sort((first, second) => second.nameLength - first.nameLength)
  if (longestMatch === undefined) return undefined
  return {
    person: longestMatch.person,
    otherWords: longestMatch.otherWords.join(WORD_SEPARATOR),
  }
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
  return [
    person.canonical_name,
    ...person.name_variants,
    ...getNameSpellings(person).map(({ spelling }) => spelling),
  ]
}

// A browser can reuse an API answer for an hour, so the first hour after this
// field ships can pair the new code with an answer that lacks it.
export function getNameSpellings(person: {
  name_spellings: PersonNameSpellingData[]
}): PersonNameSpellingData[] {
  return person.name_spellings ?? []
}

function getOtherNameSpellings(
  nameSpellings: PersonNameSpellingData[]
): PersonNameSpellingData[] {
  return nameSpellings.filter(
    ({ kind }) => kind !== PersonNameSpellingKind.CANONICAL
  )
}

export function getOtherNameLabel(kind: PersonNameSpellingKind): string {
  return kind === PersonNameSpellingKind.OTHER_NAME
    ? OTHER_NAME_LABEL
    : OTHER_SPELLING_LABEL
}

export function formatOtherNames(
  nameSpellings: PersonNameSpellingData[]
): string {
  const otherNameSpellings = getOtherNameSpellings(nameSpellings)
  return [
    ...new Set(otherNameSpellings.map(({ kind }) => getOtherNameLabel(kind))),
  ]
    .map((label) => {
      const names = otherNameSpellings
        .filter(({ kind }) => getOtherNameLabel(kind) === label)
        .map(({ spelling }) => spelling)
      return `${label} ${names.join(OTHER_NAME_SEPARATOR)}`
    })
    .join(OTHER_NAME_LINE_SEPARATOR)
}

// "Lim Chin Siong" is also a word-prefix match for "Lim Ching Siong", so a
// spelling shows only when it matches better than the name on the page.
export function getMatchedNameSpelling(
  query: string,
  person: PersonData
): PersonNameSpellingData | undefined {
  const canonicalRank = getPersonNameMatchRank(query, [person.canonical_name])
  return getOtherNameSpellings(getNameSpellings(person)).find(
    ({ spelling }) => {
      const spellingRank = getPersonNameMatchRank(query, [spelling])
      return (
        spellingRank !== undefined &&
        (canonicalRank === undefined || spellingRank < canonicalRank)
      )
    }
  )
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
