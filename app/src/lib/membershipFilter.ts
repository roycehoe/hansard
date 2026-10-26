import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { removeConstituencySuffix } from '@/lib/utils'
import type {
  ConstituencyData,
  MembershipFilters,
} from '@/types/search/interfaces'

const CONSTITUENCY_SEPARATOR = /[\s-]+/g

export function foldConstituencyName(constituency: string): string {
  return removeConstituencySuffix(
    constituency.replace(CONSTITUENCY_SEPARATOR, ' ')
  ).toLowerCase()
}

function isMembershipMatched(
  person: PersonData,
  membership: MembershipData,
  filters: MembershipFilters
): boolean {
  const foldedConstituency = foldConstituencyName(filters.constituency)
  return (
    (filters.personId === undefined || person.person_id === filters.personId) &&
    (filters.parliamentNumber === undefined ||
      membership.parliament_number === filters.parliamentNumber) &&
    (foldedConstituency === '' ||
      membership.constituencies.some(
        (name) => foldConstituencyName(name) === foldedConstituency
      ))
  )
}

function getMatchedMemberships(
  persons: PersonData[],
  filters: MembershipFilters
): MembershipData[] {
  return persons.flatMap((person) =>
    person.memberships.filter((membership) =>
      isMembershipMatched(person, membership, filters)
    )
  )
}

export function filterPersonsByMembership(
  persons: PersonData[],
  filters: MembershipFilters
): PersonData[] {
  if (filters.parliamentNumber === undefined && filters.constituency === '')
    return persons
  const seatFilters = { ...filters, personId: undefined }
  return persons.filter((person) =>
    person.memberships.some((membership) =>
      isMembershipMatched(person, membership, seatFilters)
    )
  )
}

export function filterConstituenciesByMembership(
  constituencies: ConstituencyData[],
  persons: PersonData[],
  filters: MembershipFilters
): ConstituencyData[] {
  if (filters.personId === undefined && filters.parliamentNumber === undefined)
    return constituencies
  const heldNames = new Set(
    getMatchedMemberships(persons, { ...filters, constituency: '' })
      .filter((membership) => membership.is_member)
      .flatMap((membership) => membership.constituencies)
  )
  return constituencies.filter((constituency) =>
    heldNames.has(constituency.name)
  )
}

export function filterParliamentsByMembership(
  parliaments: ParliamentData[],
  persons: PersonData[],
  filters: MembershipFilters
): ParliamentData[] {
  if (filters.personId === undefined && filters.constituency === '')
    return parliaments
  const heldParliamentNumbers = new Set(
    getMatchedMemberships(persons, {
      ...filters,
      parliamentNumber: undefined,
    }).map((membership) => membership.parliament_number)
  )
  return parliaments.filter(
    (parliament) =>
      heldParliamentNumbers.has(parliament.parliament_number) ||
      parliament.parliament_number === filters.parliamentNumber
  )
}
