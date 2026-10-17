import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import { useGetAllParties } from '@/api/people/getAllParties'
import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { useGetAllPersons } from '@/api/people/getAllPersons'
import { PageHeader } from '@/components/layout/PageHeader'
import type { FormFilterPersonsValues } from '@/components/people/FormFilterPersons'
import { FormFilterPersons } from '@/components/people/FormFilterPersons'
import { ListPersons } from '@/components/people/ListPersons'
import { NoticeErrorPersons } from '@/components/people/NoticeErrorPersons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FILTER_ALL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { mapFilterToSearchValue } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const peopleSearchSchema = z.object({
  parliament: z.coerce.number().int().min(0).optional(),
  party: z.string().optional(),
  name: z.string().optional(),
})

function isMatchingMembership(
  membership: MembershipData,
  parliament: number | undefined,
  party: string | undefined
): boolean {
  const isMatchingParliament =
    parliament === undefined ||
    (parliament === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
      ? membership.is_legislative_assembly
      : membership.parliament_number === parliament)
  return (
    isMatchingParliament && (party === undefined || membership.party === party)
  )
}

function filterPersonsByMembershipAndName(
  persons: PersonData[],
  parliament: number | undefined,
  party: string | undefined,
  name: string
): PersonData[] {
  const lowerCaseName = name.trim().toLowerCase()
  return persons.filter(
    (person) =>
      person.canonical_name.toLowerCase().includes(lowerCaseName) &&
      person.memberships.some((membership) =>
        isMatchingMembership(membership, parliament, party)
      )
  )
}

export const Route = createFileRoute('/people/')({
  validateSearch: peopleSearchSchema,
  component: function PagePeople() {
    useDocumentTitle('People')
    const { parliament, party, name } = Route.useSearch()
    const navigate = useNavigate()
    const parliaments = useGetAllParliaments()
    const parties = useGetAllParties()
    const persons = useGetAllPersons({})
    // The router commits a search change a microtask after navigate, too late
    // for a controlled input, so the typed name lives in state and is reset
    // only when the URL name changes from elsewhere, such as the Clear link.
    const [typedName, setTypedName] = useState<string>(name ?? '')
    const [lastUrlName, setLastUrlName] = useState<string | undefined>(name)
    if (name !== lastUrlName) {
      setLastUrlName(name)
      setTypedName(name ?? '')
    }
    const isLoading =
      parliaments.isLoading || parties.isLoading || persons.isLoading
    const isError = parliaments.isError || parties.isError || persons.isError
    const isRefetching =
      parliaments.isRefetching || parties.isRefetching || persons.isRefetching

    function retryPeople() {
      void parliaments.refetch()
      void parties.refetch()
      void persons.refetch()
    }

    function applyFilters(values: FormFilterPersonsValues) {
      const parliamentValue = mapFilterToSearchValue(values.parliament)
      setTypedName(values.name)
      void navigate({
        to: '/people',
        search: {
          parliament:
            parliamentValue === undefined ? undefined : Number(parliamentValue),
          party: mapFilterToSearchValue(values.party),
          name: mapFilterToSearchValue(values.name),
        },
        replace: true,
      })
    }

    function renderBody() {
      if (isLoading) return <Skeleton className="h-96 w-full" />
      if (isError || !parliaments.data || !parties.data || !persons.data) {
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
              name: typedName,
            }}
            parliaments={parliaments.data.parliaments}
            parties={parties.data.parties}
            onChange={applyFilters}
          />
          <ListPersons
            persons={filterPersonsByMembershipAndName(
              persons.data.persons,
              parliament,
              party,
              typedName
            )}
          />
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="People"
          description="Everyone who appears in the Hansard record, with their memberships."
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
