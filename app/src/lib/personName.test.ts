import type { PersonData } from '@/api/people/getAllPersons'
import { PersonNameSpellingKind } from '@/constants/people/enums'
import {
  formatOtherNames,
  getMatchedNameSpelling,
  getPersonNameMatches,
  getPersonNameMatchRank,
} from '@/lib/personName'
import { describe, expect, it } from 'vitest'

describe('getPersonNameMatchRank', () => {
  it('matches printed initials across punctuation', () => {
    expect(getPersonNameMatchRank('J.B. Jeyaretnam', ['J B Jeyaretnam'])).toBe(
      0
    )
  })

  it('matches a stored label held in the variants', () => {
    expect(
      getPersonNameMatchRank('Goode W.A.C.', ['William Goode', 'Goode W.A.C.'])
    ).toBe(0)
  })

  it('keeps Haji as a name part', () => {
    expect(
      getPersonNameMatchRank('Haji', ['Mohd Ariff Bin Suradi, Haji'])
    ).toBe(2)
  })

  it('matches Dr Tan Cheng Bock to Tan Cheng Bock', () => {
    expect(
      getPersonNameMatchRank('Dr Tan Cheng Bock', ['Tan Cheng Bock'])
    ).toBe(0)
  })

  it('matches Dr Lee with or without a title in the stored name', () => {
    expect(getPersonNameMatchRank('Dr Lee', ['Lee Siew Choh'])).toBe(2)
    expect(
      getPersonNameMatchRank('Dr Lee', ['Lee Siew Choh', 'Lee Siew Choh, Dr'])
    ).toBe(2)
  })

  it('matches nobody on a title alone', () => {
    expect(getPersonNameMatchRank('dr', ['Lee Siew Choh, Dr'])).toBeUndefined()
  })

  it('keeps Bin as a name part', () => {
    expect(getPersonNameMatchRank('Bin', ['Mohd Ariff Bin Suradi'])).toBe(2)
    expect(
      getPersonNameMatchRank('Haji', ['Mohd Ariff Bin Suradi'])
    ).toBeUndefined()
  })

  it('returns undefined for an empty query', () => {
    expect(getPersonNameMatchRank('', ['Lee Siew Choh'])).toBeUndefined()
    expect(getPersonNameMatchRank('  ', ['Lee Siew Choh'])).toBeUndefined()
  })

  it('ranks exact, same words, then prefixes', () => {
    expect(getPersonNameMatchRank('Tan Cheng Bock', ['Tan Cheng Bock'])).toBe(0)
    expect(getPersonNameMatchRank('Bock Tan Cheng', ['Tan Cheng Bock'])).toBe(1)
    expect(getPersonNameMatchRank('Tan Ch', ['Tan Cheng Bock'])).toBe(2)
  })

  it('matches dotted, spaced and undotted initials to given names', () => {
    expect(getPersonNameMatchRank('Lee K.Y.', ['Lee Kuan Yew'])).toBe(2)
    expect(getPersonNameMatchRank('Lee K. Y.', ['Lee Kuan Yew'])).toBe(2)
    expect(getPersonNameMatchRank('Lee K Y', ['Lee Kuan Yew'])).toBe(2)
    expect(getPersonNameMatchRank('K.Y. Lee', ['Lee Kuan Yew'])).toBe(2)
    expect(
      getPersonNameMatchRank('J. B. Jeyaretnam', ['Joshua Benjamin Jeyaretnam'])
    ).toBe(2)
  })

  it('matches initials only to names in order and side by side', () => {
    expect(getPersonNameMatchRank('Lee Y.K.', ['Lee Kuan Yew'])).toBeUndefined()
    expect(
      getPersonNameMatchRank('Lee K.Y.', ['Lee Kuan Hock Yew'])
    ).toBeUndefined()
  })

  it('reads letters typed as one word as a word, not initials', () => {
    expect(getPersonNameMatchRank('Lee KY', ['Lee Kuan Yew'])).toBeUndefined()
  })

  it('takes the lowest rank over all names', () => {
    expect(getPersonNameMatchRank('Lee', ['Lee Siew Choh', 'Lee'])).toBe(0)
  })
})

describe('getPersonNameMatches', () => {
  const persons: PersonData[] = [
    'Lee Kuan Yew',
    'Goh Chok Tong',
    'J B Jeyaretnam',
    'Tan Cheng Bock',
    'Teo Ai Nam',
    'Ng Eng Hen',
    'N. Govindasamy',
    'Amrin Amin',
    'Abdul Aziz Bin Haji Karim',
  ].map((name, index) => ({
    person_id: index,
    person_slug: '',
    canonical_name: name,
    name_variants: [],
    name_spellings: [],
    memberships: [],
  }))

  function getMatchedNames(query: string): string[] {
    return getPersonNameMatches(query, persons).map(
      ({ person }) => person.canonical_name
    )
  }

  it('matches a 3-letter acronym below word matches', () => {
    expect(getPersonNameMatches('lky', persons)).toEqual([
      { person: persons[0], rank: 3 },
    ])
    expect(getMatchedNames('Mr GCT')).toEqual(['Goh Chok Tong'])
  })

  it('splits a stored initial run into its letters', () => {
    expect(getMatchedNames('jbj')).toEqual(['J B Jeyaretnam'])
  })

  it('matches no 2-letter or 5-letter acronym', () => {
    expect(getMatchedNames('aa')).toEqual([])
    expect(getMatchedNames('aabhk')).toEqual([])
  })

  it('keeps word matches when the query is also an acronym', () => {
    expect(getMatchedNames('tan')).toEqual(['Tan Cheng Bock'])
    expect(getMatchedNames('ng')).toEqual(['Ng Eng Hen'])
  })
})

describe('person name spellings', () => {
  const canonicalNameToOtherNames: [string, string[]][] = [
    ['Lim Ching Siong', ['Lim Chin Siong']],
    ['Baharudin Bin Mohamed Ariff', ['Baharuddin Bin Mohamed Ariff']],
    ['Chew Chin Han', ['Chew Chin Harn']],
    ['Koo Young', ['Koo Yong']],
    ['Lai Tha Chai', ['Lai Tai Chai']],
    ['Zulkifli Bin Mohammed', ['Zulkifli Bin Mohamed']],
    ['Ahmad Khalis bin Abdul Ghani', ['Ahmad Khalis bin Abdul Gahni']],
    ['Abdul Nasser Bin Kamaruddin', ['Abdul Nasser Bin Kamarudin']],
    ['Jek Yeun Thong', ['Jek Yuen Thong']],
    ['Rahmat Bin Kenap', ['Rahamat Bin Kenap']],
    ['Yaacob Bin Mohamed', ["Ya'acob Bin Mohamed"]],
    ['Seet Ai Mee', ['Seet Ai Mei']],
    ['Mohamad Maidin', ['Mohamed Maidin BPM', 'Mohammad Maidin']],
    ['Low Por Tuck', ['Lau Peter']],
  ]
  const OTHER_NAME_SPELLINGS = canonicalNameToOtherNames.flatMap(
    ([canonicalName, otherNames]) =>
      otherNames.map((otherName) => [canonicalName, otherName])
  )

  function getPerson(
    canonicalName: string,
    otherNames: string[],
    personId: number
  ): PersonData {
    return {
      person_id: personId,
      person_slug: '',
      canonical_name: canonicalName,
      name_variants: [],
      name_spellings: [
        {
          spelling: canonicalName,
          kind: PersonNameSpellingKind.CANONICAL,
          note: '',
        },
        ...otherNames.map((spelling) => ({
          spelling,
          kind:
            canonicalName === 'Low Por Tuck'
              ? PersonNameSpellingKind.OTHER_NAME
              : PersonNameSpellingKind.OTHER_SPELLING,
          note: '',
        })),
      ],
      memberships: [],
    }
  }

  const persons = canonicalNameToOtherNames.map(
    ([canonicalName, otherNames], index) =>
      getPerson(canonicalName, otherNames, index)
  )
  const personsWithNoSpellings = persons.map((person) => ({
    ...person,
    name_spellings: [],
  }))

  it('covers the 14 people of the spelling notes', () => {
    expect(
      new Set(persons.map(({ canonical_name }) => canonical_name)).size
    ).toBe(14)
  })

  it.each(OTHER_NAME_SPELLINGS)(
    'finds %s by %s as an exact match',
    (canonicalName, otherName) => {
      expect(
        getPersonNameMatches(otherName, persons).map(({ person, rank }) => [
          person.canonical_name,
          rank,
        ])
      ).toEqual([[canonicalName, 0]])
    }
  )

  it.each(OTHER_NAME_SPELLINGS)(
    'has no exact match for %s by %s without the spelling',
    (canonicalName, otherName) => {
      expect(
        getPersonNameMatches(otherName, personsWithNoSpellings).filter(
          ({ person, rank }) =>
            person.canonical_name === canonicalName && rank === 0
        )
      ).toEqual([])
    }
  )

  it('finds nobody by a spelling no source prints', () => {
    expect(getPersonNameMatches('Lim Chan Siong', persons)).toEqual([])
  })

  it('names the matched spelling only when it beats the name on the page', () => {
    const [lim] = persons

    expect(getMatchedNameSpelling('Lim Chin Siong', lim)?.spelling).toBe(
      'Lim Chin Siong'
    )
    expect(getMatchedNameSpelling('Lim Ching Siong', lim)).toBeUndefined()
    expect(getMatchedNameSpelling('Lim', lim)).toBeUndefined()
    expect(getMatchedNameSpelling('', lim)).toBeUndefined()
  })

  it('reads a cached answer from before the field shipped', () => {
    const person = {
      ...persons[0],
      name_spellings: undefined,
    } as unknown as PersonData

    expect(getPersonNameMatches('Lim Ching Siong', [person])).toEqual([
      { person, rank: 0 },
    ])
    expect(getMatchedNameSpelling('Lim Chin Siong', person)).toBeUndefined()
  })

  it('labels a spelling and a printed name differently', () => {
    const maidin = persons[12]
    const low = persons[13]

    expect(formatOtherNames(maidin.name_spellings)).toBe(
      'Also spelled Mohamed Maidin BPM, Mohammad Maidin'
    )
    expect(formatOtherNames(low.name_spellings)).toBe(
      'Also printed as Lau Peter'
    )
    expect(formatOtherNames([])).toBe('')
  })
})
