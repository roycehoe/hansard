import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { useGetAllPersons } from '@/api/people/getAllPersons'
import { PageHeader } from '@/components/layout/PageHeader'
import type { FormFilterPersonsValues } from '@/components/people/FormFilterPersons'
import { FormFilterPersons } from '@/components/people/FormFilterPersons'
import { ListPersons } from '@/components/people/ListPersons'
import { NoticeErrorPersons } from '@/components/people/NoticeErrorPersons'
import { SkeletonPersons } from '@/components/people/SkeletonPersons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  FILTER_ALL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'
import {
  CONSTITUENCY_SUFFIX_WORDS,
  MEMBERSHIP_PARLIAMENT_NUMBERS,
} from '@/constants/people/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildWordStartPattern } from '@/lib/highlight'
import {
  isEveryWordMatched,
  mapFilterToSearchValue,
  splitIntoWords,
} from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const peopleSearchSchema = z.object({
  parliament: z.coerce.number().int().min(0).optional(),
  party: z.string().optional(),
  constituency: z.string().optional(),
  name: z.string().optional(),
})

function splitIntoConstituencyWords(text: string): string[] {
  return splitIntoWords(text).filter(
    (word) => !CONSTITUENCY_SUFFIX_WORDS.has(word)
  )
}

function isMatchingMembership(
  membership: MembershipData,
  parliament: number | undefined,
  party: string | undefined,
  constituencyWords: string[]
): boolean {
  const isMatchingParliament =
    parliament === undefined ||
    (parliament === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
      ? membership.is_legislative_assembly
      : membership.parliament_number === parliament)
  return (
    isMatchingParliament &&
    (party === undefined || membership.party === party) &&
    (constituencyWords.length === 0 ||
      membership.constituencies.some((constituency) =>
        isEveryWordMatched(constituencyWords, splitIntoWords(constituency))
      ))
  )
}

function filterPersonsByMembershipAndName(
  persons: PersonData[],
  parliament: number | undefined,
  party: string | undefined,
  nameWords: string[],
  constituencyWords: string[]
): PersonData[] {
  return persons.filter(
    (person) =>
      isEveryWordMatched(nameWords, splitIntoWords(person.canonical_name)) &&
      person.memberships.some((membership) =>
        isMatchingMembership(membership, parliament, party, constituencyWords)
      )
  )
}

function getPartiesInParliament(
  persons: PersonData[],
  parliament: number | undefined,
  party: string | undefined
): string[] {
  const parties = new Set(
    persons.flatMap((person) =>
      person.memberships
        .filter((membership) =>
          isMatchingMembership(membership, parliament, undefined, [])
        )
        .map((membership) => membership.party)
    )
  )
  if (party !== undefined) parties.add(party)
  return [...parties].sort()
}

function getParliamentNumbersWithParty(
  persons: PersonData[],
  parliament: number | undefined,
  party: string | undefined
): number[] {
  const memberships = persons.flatMap((person) => person.memberships)
  return MEMBERSHIP_PARLIAMENT_NUMBERS.filter(
    (parliamentNumber) =>
      parliamentNumber === parliament ||
      memberships.some((membership) =>
        isMatchingMembership(membership, parliamentNumber, party, [])
      )
  )
}

export const Route = createFileRoute('/people/')({
  validateSearch: peopleSearchSchema,
  component: function PagePeople() {
    useDocumentTitle('People')
    const { parliament, party, constituency, name } = Route.useSearch()
    const navigate = useNavigate()
    const parliaments = useGetAllParliaments()
    const persons = useGetAllPersons({})
    // The router commits a search change a microtask after navigate, too late
    // for a controlled input, so the typed words live in state and are reset
    // only when the URL words change from elsewhere, such as the Clear link.
    const [typedName, setTypedName] = useState<string>(name ?? '')
    const [lastUrlName, setLastUrlName] = useState<string | undefined>(name)
    const [typedConstituency, setTypedConstituency] = useState<string>(
      constituency ?? ''
    )
    const [lastUrlConstituency, setLastUrlConstituency] = useState<
      string | undefined
    >(constituency)
    if (name !== lastUrlName) {
      setLastUrlName(name)
      setTypedName(name ?? '')
    }
    if (constituency !== lastUrlConstituency) {
      setLastUrlConstituency(constituency)
      setTypedConstituency(constituency ?? '')
    }
    const nameWords = splitIntoWords(typedName)
    const constituencyWords = splitIntoConstituencyWords(typedConstituency)
    const isLoading = parliaments.isLoading || persons.isLoading
    const isError = parliaments.isError || persons.isError
    const isRefetching = parliaments.isRefetching || persons.isRefetching

    function retryPeople() {
      void parliaments.refetch()
      void persons.refetch()
    }

    function applyFilters(values: FormFilterPersonsValues) {
      const parliamentValue = mapFilterToSearchValue(values.parliament)
      setTypedName(values.name)
      setTypedConstituency(values.constituency)
      void navigate({
        to: '/people',
        search: {
          parliament:
            parliamentValue === undefined ? undefined : Number(parliamentValue),
          party: mapFilterToSearchValue(values.party),
          constituency: mapFilterToSearchValue(values.constituency),
          name: mapFilterToSearchValue(values.name),
        },
        replace: true,
      })
    }

    function renderBody() {
      if (isLoading) return <SkeletonPersons />
      if (isError || !parliaments.data || !persons.data) {
        return (
          <NoticeErrorPersons onRetry={retryPeople} isRetrying={isRefetching} />
        )
      }
      return (
        <div className="space-y-6">
          <FormFilterPersons
            values={{
              parliament:
                parliament === undefined ? FILTER_ALL : String(parliament),
              party: party ?? FILTER_ALL,
              constituency: typedConstituency,
              name: typedName,
            }}
            parliaments={parliaments.data.parliaments}
            parliamentNumbers={getParliamentNumbersWithParty(
              persons.data.persons,
              parliament,
              party
            )}
            parties={getPartiesInParliament(
              persons.data.persons,
              parliament,
              party
            )}
            onChange={applyFilters}
          />
          <ListPersons
            persons={filterPersonsByMembershipAndName(
              persons.data.persons,
              parliament,
              party,
              nameWords,
              constituencyWords
            )}
            namePattern={buildWordStartPattern(nameWords)}
            constituencyPattern={buildWordStartPattern(constituencyWords)}
          />
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="People"
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>People</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        {renderBody()}
      </div>
    )
  },
})
