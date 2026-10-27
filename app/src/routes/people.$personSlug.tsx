import { ApiError } from '@/api/client'
import { useGetPerson } from '@/api/people/getPerson'
import { useGetPersonReports } from '@/api/people/getPersonReports'
import { ButtonCopyLink } from '@/components/layout/ButtonCopyLink'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationInfiniteScroll } from '@/components/layout/PaginationInfiniteScroll'
import { TextSource } from '@/components/layout/TextSource'
import { BadgeSittingMember } from '@/components/people/BadgeSittingMember'
import { ListPersonReports } from '@/components/people/ListPersonReports'
import { NoticeErrorPerson } from '@/components/people/NoticeErrorPerson'
import { NoticeErrorPersonReports } from '@/components/people/NoticeErrorPersonReports'
import { NoticeNotFoundPerson } from '@/components/people/NoticeNotFoundPerson'
import { SkeletonPerson } from '@/components/people/SkeletonPerson'
import { TableMemberships } from '@/components/people/TableMemberships'
import { TableParliamentCounts } from '@/components/people/TableParliamentCounts'
import { SkeletonReportRows } from '@/components/reports/SkeletonReportRows'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { HTTP_NOT_FOUND } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isSittingMember, parsePersonSlug } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/people/$personSlug')({
  component: function PagePerson() {
    const { personSlug } = Route.useParams()
    const navigate = useNavigate()
    const { personId, slug } = parsePersonSlug(personSlug)
    const person = useGetPerson({ person_id: personId })
    const reports = useGetPersonReports({ person_id: personId })
    const canonicalSlug = person.data?.person_slug
    useDocumentTitle(person.data?.canonical_name ?? 'Person')

    useEffect(
      function redirectToCanonicalSlug() {
        if (canonicalSlug === undefined || canonicalSlug === slug) return
        void navigate({
          to: '/people/$personSlug',
          params: { personSlug: `${personId}-${canonicalSlug}` },
          replace: true,
        })
      },
      [canonicalSlug, slug, personId, navigate]
    )

    function retryPerson() {
      void person.refetch()
    }

    function retryReports() {
      void reports.refetch()
    }

    function loadMoreReports() {
      void reports.fetchNextPage()
    }

    function renderReports() {
      if (reports.isLoading) return <SkeletonReportRows />
      if (reports.isLoadingError || !reports.data) {
        return (
          <NoticeErrorPersonReports
            onRetry={retryReports}
            isRetrying={reports.isRefetching}
          />
        )
      }
      const personReports = reports.data.pages.flatMap((page) => page.reports)
      return (
        <div className="space-y-4">
          <ListPersonReports reports={personReports} />
          <PaginationInfiniteScroll
            hasNextPage={reports.hasNextPage}
            isFetchingNextPage={reports.isFetchingNextPage}
            isFetchNextPageError={reports.isFetchNextPageError}
            onLoadMore={loadMoreReports}
            loadingRows={<SkeletonReportRows />}
            shownCount={personReports.length}
          />
        </div>
      )
    }

    if (!(personId >= 1)) return <NoticeNotFoundPerson />
    if (person.isLoading) return <SkeletonPerson />
    if (
      person.isLoadingError &&
      person.error instanceof ApiError &&
      person.error.status === HTTP_NOT_FOUND
    ) {
      return <NoticeNotFoundPerson />
    }
    if (person.isLoadingError || !person.data) {
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
          badge={isSittingMember(data.memberships) && <BadgeSittingMember />}
          description={
            nameVariants === ''
              ? undefined
              : `Also recorded as: ${nameVariants}`
          }
          titleAction={
            <ButtonCopyLink
              path={`/people/${data.person_id}-${data.person_slug}`}
            />
          }
          actions={
            <Button asChild variant="outline" size="sm">
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
              Paragraphs and attendance
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
