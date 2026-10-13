import { useGetAllParties } from '@/api/people/getAllParties'
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
import { FILTER_ALL } from '@/constants/constants'
import { mapFilterToSearchValue } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const peopleSearchSchema = z.object({
  parliament: z.coerce.number().int().min(0).optional(),
  party: z.string().optional(),
  name: z.string().optional(),
})

export const Route = createFileRoute('/people/')({
  validateSearch: peopleSearchSchema,
  component: function PagePeople() {
    const { parliament, party, name } = Route.useSearch()
    const navigate = useNavigate()
    const parties = useGetAllParties()
    const persons = useGetAllPersons({
      parliament_number: parliament,
      party,
      name,
    })
    const isLoading = parties.isLoading || persons.isLoading
    const isError = parties.isError || persons.isError
    const isRefetching = parties.isRefetching || persons.isRefetching

    function retryPeople() {
      void parties.refetch()
      void persons.refetch()
    }

    function applyFilters(values: FormFilterPersonsValues) {
      const parliamentValue = mapFilterToSearchValue(values.parliament)
      void navigate({
        to: '/people',
        search: {
          parliament:
            parliamentValue === undefined ? undefined : Number(parliamentValue),
          party: mapFilterToSearchValue(values.party),
          name: mapFilterToSearchValue(values.name.trim()),
        },
      })
    }

    function renderBody() {
      if (isLoading) return <Skeleton className="h-96 w-full" />
      if (isError || !parties.data || !persons.data) {
        return (
          <NoticeErrorPersons onRetry={retryPeople} isRetrying={isRefetching} />
        )
      }
      return (
        <div className="space-y-6">
          <FormFilterPersons
            defaultValues={{
              parliament:
                parliament === undefined ? FILTER_ALL : String(parliament),
              party: party ?? FILTER_ALL,
              name: name ?? '',
            }}
            parties={parties.data.parties}
            onSubmit={applyFilters}
          />
          <ListPersons persons={persons.data.persons} />
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
