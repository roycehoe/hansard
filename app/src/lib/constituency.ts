import type { PersonData } from '@/api/people/getAllPersons'
import { LATEST_MEMBERSHIP_PARLIAMENT_NUMBER } from '@/constants/people/constants'
import {
  NON_PLACE_CONSTITUENCIES,
  SEAT_TYPE_NAMES,
} from '@/constants/search/constants'
import { isEveryWordMatched, splitIntoWords } from '@/lib/utils'
import type { ConstituencyData } from '@/types/search/interfaces'

export function isConstituency(locationName: string): boolean {
  return !NON_PLACE_CONSTITUENCIES.has(locationName)
}

function getLocations(
  persons: PersonData[],
  isListed: (locationName: string) => boolean
): ConstituencyData[] {
  const constituencyToParliamentNumbers = new Map<string, Set<number>>()
  const seats = persons.flatMap((person) =>
    person.memberships
      .filter((membership) => membership.is_member)
      .flatMap((membership) =>
        membership.constituencies.filter(isListed).map((name) => ({
          name,
          parliamentNumber: membership.parliament_number,
        }))
      )
  )
  seats.forEach((seat) => {
    const parliamentNumbers =
      constituencyToParliamentNumbers.get(seat.name) ?? new Set<number>()
    parliamentNumbers.add(seat.parliamentNumber)
    constituencyToParliamentNumbers.set(seat.name, parliamentNumbers)
  })
  return [...constituencyToParliamentNumbers]
    .map(([name, parliamentNumbers]) => ({
      name,
      parliamentNumbers: [...parliamentNumbers].sort(
        (first, second) => first - second
      ),
      isCurrent: parliamentNumbers.has(LATEST_MEMBERSHIP_PARLIAMENT_NUMBER),
    }))
    .sort((first, second) => first.name.localeCompare(second.name))
}

export function getConstituencies(persons: PersonData[]): ConstituencyData[] {
  return getLocations(persons, isConstituency)
}

export function getSeatTypes(persons: PersonData[]): ConstituencyData[] {
  return getLocations(persons, (locationName) =>
    SEAT_TYPE_NAMES.has(locationName)
  )
}

export function getConstituencyMatches(
  query: string,
  constituencies: ConstituencyData[]
): ConstituencyData[] {
  const queryWords = splitIntoWords(query)
  return constituencies.filter((constituency) =>
    isEveryWordMatched(queryWords, splitIntoWords(constituency.name))
  )
}
