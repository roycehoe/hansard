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

function getNormalisedName(name: string): NormalisedName {
  const spaced = name.toLowerCase().replace(NON_WORD_RUN, WORD_SEPARATOR).trim()
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
