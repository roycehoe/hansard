import type { ActSummaryData } from '@/api/acts/getAllActs'

const QUOTE_PATTERN = /["“”]/g
const PUNCTUATION_PATTERN = /[^\p{L}\p{N}]/gu
const TRAILING_YEAR_PATTERN = /\s+\d{4}$/
const WORD_SEPARATOR = ' '

function getMatchWord(word: string): string {
  return word.replace(PUNCTUATION_PATTERN, '').toLowerCase()
}

function getTitleMatchWords(title: string): string[] {
  return title
    .split(/\s+/)
    .map(getMatchWord)
    .filter((word) => word !== '')
}

function findWordRun(words: string[], run: string[]): number {
  for (let start = 0; start + run.length <= words.length; start++) {
    if (run.every((word, offset) => words[start + offset] === word)) {
      return start
    }
  }
  return -1
}

function getOtherWords(words: string[]): string {
  const otherWords = words.join(WORD_SEPARATOR)
  const quoteCount = otherWords.match(QUOTE_PATTERN)?.length ?? 0
  return quoteCount % 2 === 0
    ? otherWords
    : otherWords.replace(QUOTE_PATTERN, '').trim()
}

function findActTitleRun(
  words: string[],
  act: ActSummaryData
): { start: number; length: number } | undefined {
  const titles = [act.title, act.title.replace(TRAILING_YEAR_PATTERN, '')]
  for (const title of titles) {
    const run = getTitleMatchWords(title)
    const start = findWordRun(words, run)
    if (start !== -1) return { start, length: run.length }
  }
  return undefined
}

export function getNamedAct(
  query: string,
  acts: ActSummaryData[]
): { act: ActSummaryData; typedName: string; otherWords: string } | undefined {
  const typedWords = query.split(/\s+/).filter((word) => word !== '')
  const matchWords = typedWords.map(getMatchWord)
  const [longestMatch] = acts
    .flatMap((act) => {
      const run = findActTitleRun(matchWords, act)
      return run === undefined ? [] : [{ act, ...run }]
    })
    .sort((first, second) => second.length - first.length)
  if (longestMatch === undefined) return undefined
  const { act, start, length } = longestMatch
  return {
    act,
    typedName: typedWords
      .slice(start, start + length)
      .join(WORD_SEPARATOR)
      .replace(QUOTE_PATTERN, ''),
    otherWords: getOtherWords([
      ...typedWords.slice(0, start),
      ...typedWords.slice(start + length),
    ]),
  }
}
