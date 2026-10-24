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

function getNormalisedNameWords(name: string): string[] {
  const spaced = name.toLowerCase().replace(NON_WORD_RUN, WORD_SEPARATOR).trim()
  return getTitleStrippedWords(
    spaced
      .replace(INITIAL_RUN, (run) => run.split(WORD_SEPARATOR).join(''))
      .split(WORD_SEPARATOR)
      .filter((word) => word !== '')
  )
}

function getNameMatchRank(
  queryWords: string[],
  nameWords: string[]
): number | undefined {
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
      nameWords.some((nameWord) => nameWord.startsWith(queryWord))
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
  const queryWords = getNormalisedNameWords(query)
  const ranks = names
    .map((name) => getNameMatchRank(queryWords, getNormalisedNameWords(name)))
    .filter((rank) => rank !== undefined)
  return ranks.length === 0 ? undefined : Math.min(...ranks)
}
