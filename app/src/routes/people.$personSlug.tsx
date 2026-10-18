import { ApiError } from '@/api/client'
import { useGetPerson } from '@/api/people/getPerson'
import { useGetPersonReports } from '@/api/people/getPersonReports'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationPrevNext } from '@/components/layout/PaginationPrevNext'
import { TextSource } from '@/components/layout/TextSource'
import { ListPersonReports } from '@/components/people/ListPersonReports'
import { NoticeErrorPerson } from '@/components/people/NoticeErrorPerson'
import { NoticeErrorPersonReports } from '@/components/people/NoticeErrorPersonReports'
import { NoticeNotFoundPerson } from '@/components/people/NoticeNotFoundPerson'
import { TableMemberships } from '@/components/people/TableMemberships'
import { TableParliamentCounts } from '@/components/people/TableParliamentCounts'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HTTP_NOT_FOUND } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { parsePersonSlug } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'

const FIRST_PAGE = 1

const personSearchSchema = z.object({
  page: z.coerce.number().int().min(FIRST_PAGE).optional(),
})

export const Route = createFileRoute('/people/$personSlug')({
  validateSearch: personSearchSchema,
  component: function PagePerson() {
    const { personSlug } = Route.useParams()
    const { page = FIRST_PAGE } = Route.useSearch()
    const navigate = useNavigate()
    const { personId, slug } = parsePersonSlug(personSlug)
    const person = useGetPerson({ person_id: personId })
    const reports = useGetPersonReports({ person_id: personId, page })
    const canonicalSlug = person.data?.person_slug
    useDocumentTitle(person.data?.canonical_name ?? 'Person')

    useEffect(
      function redirectToCanonicalSlug() {
        if (canonicalSlug === undefined || canonicalSlug === slug) return
        void navigate({
          to: '/people/$personSlug',
          params: { personSlug: `${personId}-${canonicalSlug}` },
          search: { page: page === FIRST_PAGE ? undefined : page },
          replace: true,
        })
      },
      [canonicalSlug, slug, personId, page, navigate]
    )

    function retryPerson() {
      void person.refetch()
    }

    function retryReports() {
      void reports.refetch()
    }

    function changePage(nextPage: number) {
      void navigate({
        to: '/people/$personSlug',
        params: { personSlug },
        search: { page: nextPage === FIRST_PAGE ? undefined : nextPage },
      })
    }

    function renderReports() {
      if (reports.isLoading) return <Skeleton className="h-64 w-full" />
      if (reports.isError || !reports.data) {
        return (
          <NoticeErrorPersonReports
            onRetry={retryReports}
            isRetrying={reports.isRefetching}
          />
        )
      }
      return (
        <>
          <ListPersonReports reports={reports.data.reports} />
          <PaginationPrevNext
            page={page}
            hasNextPage={reports.data.has_next_page}
            onPageChange={changePage}
            ariaLabel="Reports pages"
          />
        </>
      )
    }

    if (!(personId >= 1)) return <NoticeNotFoundPerson />
    if (person.isLoading) return <Skeleton className="h-96 w-full" />
    if (
      person.isError &&
      person.error instanceof ApiError &&
      person.error.status === HTTP_NOT_FOUND
    ) {
      return <NoticeNotFoundPerson />
    }
    if (person.isError || !person.data) {
      return (
        <NoticeErrorPerson
          onRetry={retryPerson}
          isRetrying={person.isRefetching}
        />
      )
    }

    const { data } = person
    const nameVariants = data.name_variants.join('; ')

    return (
      <div className="space-y-8">
        <PageHeader
          title={data.canonical_name}
          description={
            nameVariants === ''
              ? undefined
              : `Also recorded as: ${nameVariants}`
          }
          actions={
            <Button asChild variant="outline">
              <Link to="/search" search={{ person: data.person_id }}>
                Search this person's speeches
              </Link>
            </Button>
          }
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
                  <BreadcrumbLink asChild>
                    <Link to="/people">People</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{data.canonical_name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <section aria-labelledby="memberships-heading" className="space-y-2">
          <h2
            id="memberships-heading"
            className="font-serif text-xl lg:text-2xl"
          >
            Memberships
          </h2>
          <TableMemberships memberships={data.memberships} />
        </section>
        {data.parliament_counts.length > 0 && (
          <section aria-labelledby="counts-heading" className="space-y-2">
            <h2 id="counts-heading" className="font-serif text-xl lg:text-2xl">
              Speeches and attendance
            </h2>
            <TableParliamentCounts parliamentCounts={data.parliament_counts} />
          </section>
        )}
        <section aria-labelledby="reports-heading" className="space-y-4">
          <h2 id="reports-heading" className="font-serif text-xl lg:text-2xl">
            Reports
          </h2>
          {renderReports()}
        </section>
        <TextSource sittingDate={null} officialRecordUrl={null} />
      </div>
    )
  },
})
