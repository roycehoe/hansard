import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { getConstituencies, getConstituencyMatches } from '@/lib/constituency'
import { describe, expect, it } from 'vitest'

function buildMembership(
  parliamentNumber: number,
  constituencies: string[],
  isMember = true
): MembershipData {
  return {
    parliament_number: parliamentNumber,
    party: "People's Action Party",
    party_affiliations: [],
    is_legislative_assembly: parliamentNumber === 0,
    is_member: isMember,
    constituencies,
  }
}

function buildPerson(memberships: MembershipData[]): PersonData {
  return {
    person_id: 1,
    person_slug: 'person',
    canonical_name: 'Person',
    name_variants: [],
    memberships,
  }
}

describe('getConstituencies', () => {
  it('collects each seat once with every Parliament it was held in', () => {
    const constituencies = getConstituencies([
      buildPerson([
        buildMembership(5, ['Pasir Panjang']),
        buildMembership(6, ['Pasir Panjang']),
      ]),
      buildPerson([buildMembership(0, ['Pasir Panjang'])]),
    ])
    expect(constituencies).toEqual([
      { name: 'Pasir Panjang', parliamentNumbers: [0, 5, 6], isCurrent: false },
    ])
  })

  it('marks a seat held in the latest Parliament as current', () => {
    const [constituency] = getConstituencies([
      buildPerson([buildMembership(15, ['Pasir Ris-Changi'])]),
    ])
    expect(constituency.isCurrent).toBe(true)
  })

  it('leaves out labels that are not places', () => {
    expect(
      getConstituencies([
        buildPerson([
          buildMembership(15, ['Nominated Member']),
          buildMembership(14, ['Non-Constituency Member']),
          buildMembership(0, ['Acting', 'Nominated', 'ex-officio']),
        ]),
      ])
    ).toEqual([])
  })

  it('leaves out memberships of people who were not members', () => {
    expect(
      getConstituencies([
        buildPerson([buildMembership(15, ['Ang Mo Kio'], false)]),
      ])
    ).toEqual([])
  })

  it('sorts seats alphabetically', () => {
    const names = getConstituencies([
      buildPerson([buildMembership(15, ['Potong Pasir', 'Aljunied'])]),
      buildPerson([buildMembership(9, ['Pasir Ris'])]),
    ]).map((constituency) => constituency.name)
    expect(names).toEqual(['Aljunied', 'Pasir Ris', 'Potong Pasir'])
  })
})

describe('getConstituencyMatches', () => {
  const constituencies = getConstituencies([
    buildPerson([
      buildMembership(15, ['Pasir Ris-Changi', 'Potong Pasir', 'Ang Mo Kio']),
    ]),
  ])

  function getMatchNames(query: string): string[] {
    return getConstituencyMatches(query, constituencies).map(
      (constituency) => constituency.name
    )
  }

  it('matches a word anywhere in the name', () => {
    expect(getMatchNames('pasir')).toEqual(['Pasir Ris-Changi', 'Potong Pasir'])
  })

  it('matches words on either side of a hyphen', () => {
    expect(getMatchNames('ris changi')).toEqual(['Pasir Ris-Changi'])
  })

  it('matches the start of a word only', () => {
    expect(getMatchNames('asir')).toEqual([])
  })

  it('matches every seat on an empty query', () => {
    expect(getMatchNames('')).toHaveLength(3)
  })
})
