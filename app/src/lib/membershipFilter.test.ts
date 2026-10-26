import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { getConstituencies } from '@/lib/constituency'
import {
  filterConstituenciesByMembership,
  filterParliamentsByMembership,
  filterPersonsByMembership,
  foldConstituencyName,
} from '@/lib/membershipFilter'
import type { MembershipFilters } from '@/types/search/interfaces'
import { describe, expect, it } from 'vitest'

const NO_FILTERS: MembershipFilters = {
  parliamentNumber: undefined,
  personId: undefined,
  constituency: '',
}

function buildMembership(
  parliamentNumber: number,
  constituencies: string[]
): MembershipData {
  return {
    parliament_number: parliamentNumber,
    party: "People's Action Party",
    party_affiliations: [],
    is_legislative_assembly: parliamentNumber === 0,
    is_member: true,
    constituencies,
  }
}

function buildPerson(
  personId: number,
  canonicalName: string,
  memberships: MembershipData[]
): PersonData {
  return {
    person_id: personId,
    person_slug: String(personId),
    canonical_name: canonicalName,
    name_variants: [],
    memberships,
  }
}

function buildParliament(parliamentNumber: number): ParliamentData {
  return {
    parliament_number: parliamentNumber,
    sitting_count: 1,
    report_count: 1,
    text_report_count: 1,
    first_sitting_date: '2000-01-01',
    last_sitting_date: '2000-01-01',
  }
}

const persons = [
  buildPerson(1, 'Lee Kuan Yew', [
    buildMembership(0, ['Tanjong Pagar']),
    buildMembership(8, ['Tanjong Pagar']),
  ]),
  buildPerson(2, 'Yeo Toon Chia', [buildMembership(8, ['Ang Mo Kio'])]),
  buildPerson(3, 'Ng Ling Ling', [buildMembership(15, ['Ang Mo Kio'])]),
  buildPerson(4, 'Lee Hsien Loong', [
    buildMembership(8, ['Teck Ghee']),
    buildMembership(15, ['Ang Mo Kio']),
  ]),
]

describe('foldConstituencyName', () => {
  it('ignores case, hyphens and a GRC or SMC suffix', () => {
    expect(foldConstituencyName('pasir ris-changi GRC')).toBe(
      foldConstituencyName('Pasir Ris Changi')
    )
  })
})

describe('filterPersonsByMembership', () => {
  function getNames(filters: Partial<MembershipFilters>): string[] {
    return filterPersonsByMembership(persons, {
      ...NO_FILTERS,
      ...filters,
    }).map((person) => person.canonical_name)
  }

  it('keeps people who held the chosen constituency', () => {
    expect(getNames({ constituency: 'Ang Mo Kio' })).toEqual([
      'Yeo Toon Chia',
      'Ng Ling Ling',
      'Lee Hsien Loong',
    ])
  })

  it('matches the constituency however it was typed', () => {
    expect(getNames({ constituency: 'ang mo kio grc' })).toHaveLength(3)
  })

  it('keeps people who held the constituency in the chosen Parliament', () => {
    expect(
      getNames({ constituency: 'Ang Mo Kio', parliamentNumber: 8 })
    ).toEqual(['Yeo Toon Chia'])
  })

  it('treats the Legislative Assembly as a Parliament', () => {
    expect(getNames({ parliamentNumber: 0 })).toEqual(['Lee Kuan Yew'])
  })

  it('ignores the chosen person', () => {
    expect(getNames({ personId: 1 })).toHaveLength(4)
  })
})

describe('filterConstituenciesByMembership', () => {
  const constituencies = getConstituencies(persons)

  function getNames(filters: Partial<MembershipFilters>): string[] {
    return filterConstituenciesByMembership(constituencies, persons, {
      ...NO_FILTERS,
      ...filters,
    }).map((constituency) => constituency.name)
  }

  it('keeps the seats the chosen person held', () => {
    expect(getNames({ personId: 4 })).toEqual(['Ang Mo Kio', 'Teck Ghee'])
  })

  it('keeps the seats the chosen person held in the chosen Parliament', () => {
    expect(getNames({ personId: 4, parliamentNumber: 15 })).toEqual([
      'Ang Mo Kio',
    ])
  })

  it('keeps seats held in the chosen Parliament', () => {
    expect(getNames({ parliamentNumber: 8 })).toEqual([
      'Ang Mo Kio',
      'Tanjong Pagar',
      'Teck Ghee',
    ])
  })

  it('keeps every seat when no person or Parliament is chosen', () => {
    expect(getNames({ constituency: 'Ang Mo Kio' })).toHaveLength(3)
  })
})

describe('filterParliamentsByMembership', () => {
  const parliaments = [0, 8, 15].map(buildParliament)

  function getNumbers(filters: Partial<MembershipFilters>): number[] {
    return filterParliamentsByMembership(parliaments, persons, {
      ...NO_FILTERS,
      ...filters,
    }).map((parliament) => parliament.parliament_number)
  }

  it('keeps the Parliaments the chosen person sat in', () => {
    expect(getNumbers({ personId: 1 })).toEqual([0, 8])
  })

  it('keeps the Parliaments the chosen person sat in for the chosen seat', () => {
    expect(getNumbers({ personId: 4, constituency: 'Ang Mo Kio' })).toEqual([
      15,
    ])
  })

  it('keeps the chosen Parliament when nobody matches it', () => {
    expect(getNumbers({ personId: 1, parliamentNumber: 15 })).toEqual([
      0, 8, 15,
    ])
  })

  it('keeps every Parliament when no person or seat is chosen', () => {
    expect(getNumbers({ parliamentNumber: 8 })).toHaveLength(3)
  })
})
