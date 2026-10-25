import type { PersonData } from '@/api/people/getAllPersons'
import { LATEST_MEMBERSHIP_PARLIAMENT_NUMBER } from '@/constants/people/constants'
import { NON_PLACE_CONSTITUENCIES } from '@/constants/search/constants'
import { isEveryWordMatched, splitIntoWords } from '@/lib/utils'
import type { ConstituencyData } from '@/types/search/interfaces'

export function getConstituencies(persons: PersonData[]): ConstituencyData[] {
  const constituencyToParliamentNumbers = new Map<string, Set<number>>()
  const seats = persons.flatMap((person) =>
    person.memberships
      .filter((membership) => membership.is_member)
      .flatMap((membership) =>
        membership.constituencies
          .filter((name) => !NON_PLACE_CONSTITUENCIES.has(name))
          .map((name) => ({
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

export function getConstituencyMatches(
  query: string,
  constituencies: ConstituencyData[]
): ConstituencyData[] {
  const queryWords = splitIntoWords(query)
  return constituencies.filter((constituency) =>
    isEveryWordMatched(queryWords, splitIntoWords(constituency.name))
  )
}
