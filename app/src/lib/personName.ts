const NON_WORD_RUN = /[^\p{L}\p{N}]+/gu
const INITIAL_RUN = /(?<![\p{L}\p{N}])\p{L}(?: \p{L})+(?![\p{L}\p{N}])/gu
const WORD_SEPARATOR = ' '
const EXACT_RANK = 0
const SAME_WORDS_RANK = 1
const WORD_PREFIXES_RANK = 2

function getNormalisedNameWords(name: string): string[] {
  const spaced = name.toLowerCase().replace(NON_WORD_RUN, WORD_SEPARATOR).trim()
  return spaced
    .replace(INITIAL_RUN, (run) => run.split(WORD_SEPARATOR).join(''))
    .split(WORD_SEPARATOR)
    .filter((word) => word !== '')
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

// Port of api/utils/person_name.py. Keep the two in step.
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
