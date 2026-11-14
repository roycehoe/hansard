import type { ActSummaryData } from '@/api/acts/getAllActs'
import { getNamedAct } from '@/lib/actName'
import { describe, expect, it } from 'vitest'

const ACTS: ActSummaryData[] = [
  { sso_code: 'EmA1968', title: 'Employment Act 1968' },
  { sso_code: 'EFMA1990', title: 'Employment of Foreign Manpower Act 1990' },
  { sso_code: 'MDA1973', title: 'Misuse of Drugs Act 1973' },
  { sso_code: 'PAA1960', title: 'People’s Association Act 1960' },
  {
    sso_code: 'LCSCA2015',
    title: 'Liquor Control (Supply and Consumption) Act 2015',
  },
  { sso_code: 'PEOA1976', title: 'Pensions (Expatriate Officers) Act' },
  { sso_code: 'CA1967', title: 'Companies Act 1967' },
  {
    sso_code: 'VCCA2018',
    title: 'Variable Capital Companies Act 2018',
  },
]

function getCode(query: string): string | undefined {
  return getNamedAct(query, ACTS)?.act.sso_code
}

describe('getNamedAct', () => {
  it('names an Act typed without its year', () => {
    expect(getNamedAct('Employment Act', ACTS)).toEqual({
      act: ACTS[0],
      typedName: 'Employment Act',
      otherWords: '',
    })
  })

  it('names an Act typed with its year', () => {
    expect(getNamedAct('employment act 1968', ACTS)).toEqual({
      act: ACTS[0],
      typedName: 'employment act 1968',
      otherWords: '',
    })
  })

  it('keeps the words typed before and after the name', () => {
    expect(getNamedAct('section Misuse of Drugs Act 33B', ACTS)).toEqual({
      act: ACTS[2],
      typedName: 'Misuse of Drugs Act',
      otherWords: 'section 33B',
    })
  })

  it('drops the quote marks around the name', () => {
    expect(getNamedAct('"Misuse of Drugs Act" 33B', ACTS)).toEqual({
      act: ACTS[2],
      typedName: 'Misuse of Drugs Act',
      otherWords: '33B',
    })
  })

  it('keeps a quoted phrase among the other words', () => {
    expect(
      getNamedAct('Employment Act "notice period"', ACTS)?.otherWords
    ).toBe('"notice period"')
  })

  it('drops a quote mark the name leaves unpaired', () => {
    expect(getNamedAct('"Misuse of Drugs Act 33B"', ACTS)?.otherWords).toBe(
      '33B'
    )
  })

  it('ignores punctuation, as ADR 0011 does', () => {
    expect(getCode("People's Association Act")).toBe('PAA1960')
    expect(getCode('Liquor Control Supply and Consumption Act')).toBe(
      'LCSCA2015'
    )
  })

  it('names an Act whose title carries no year', () => {
    expect(getCode('Pensions (Expatriate Officers) Act')).toBe('PEOA1976')
  })

  it('takes the longest title the words contain', () => {
    expect(getCode('Variable Capital Companies Act')).toBe('VCCA2018')
  })

  it('needs the title words next to each other', () => {
    expect(getCode('Employment of Foreign Manpower Act')).toBe('EFMA1990')
    expect(getCode('employment foreign act')).toBeUndefined()
  })

  it('does not expand a short name', () => {
    expect(getCode('MDA 33B')).toBeUndefined()
  })

  it('does not read a title cut short as the Act', () => {
    expect(getCode('Misuse of Drugs')).toBeUndefined()
  })
})
