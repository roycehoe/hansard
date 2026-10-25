import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { filterPersonsByParliament } from '@/lib/utils'
import { describe, expect, it } from 'vitest'

function buildPerson(
  canonicalName: string,
  parliamentNumbers: number[]
): PersonData {
  return {
    person_id: 1,
    person_slug: 'person',
    canonical_name: canonicalName,
    name_variants: [],
    memberships: parliamentNumbers.map((parliamentNumber): MembershipData => ({
      parliament_number: parliamentNumber,
      party: "People's Action Party",
      party_affiliations: [],
      is_legislative_assembly: parliamentNumber === 0,
      is_member: true,
      constituencies: [],
    })),
  }
}

describe('filterPersonsByParliament', () => {
  const persons = [
    buildPerson('Lee Kuan Yew', [1, 12]),
    buildPerson('Ng Shi Xuan', [15]),
    buildPerson('Lim Yew Hock', [0]),
  ]

  function getNames(parliamentNumber: number | undefined): string[] {
    return filterPersonsByParliament(persons, parliamentNumber).map(
      (person) => person.canonical_name
    )
  }

  it('keeps people with a membership in the chosen Parliament', () => {
    expect(getNames(12)).toEqual(['Lee Kuan Yew'])
  })

  it('treats the Legislative Assembly as a Parliament', () => {
    expect(getNames(0)).toEqual(['Lim Yew Hock'])
  })

  it('keeps everyone when no Parliament is chosen', () => {
    expect(getNames(undefined)).toHaveLength(3)
  })
})
