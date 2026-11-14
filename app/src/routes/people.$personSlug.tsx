import { ApiError } from '@/api/client'
import { useGetPerson } from '@/api/people/getPerson'
import { useGetPersonReports } from '@/api/people/getPersonReports'
import { ButtonCopyLink } from '@/components/layout/ButtonCopyLink'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationInfiniteScroll } from '@/components/layout/PaginationInfiniteScroll'
import { BadgeSittingMember } from '@/components/people/BadgeSittingMember'
import { ListPersonBillsByParliament } from '@/components/people/ListPersonBillsByParliament'
import { ListPersonReports } from '@/components/people/ListPersonReports'
import { NoticeErrorPerson } from '@/components/people/NoticeErrorPerson'
import { NoticeErrorPersonBills } from '@/components/people/NoticeErrorPersonBills'
import { NoticeErrorPersonReports } from '@/components/people/NoticeErrorPersonReports'
import { NoticeNotFoundPerson } from '@/components/people/NoticeNotFoundPerson'
import { SectionMemberTimeline } from '@/components/people/SectionMemberTimeline'
import { SkeletonPerson } from '@/components/people/SkeletonPerson'
import { TableMemberships } from '@/components/people/TableMemberships'
import { TableParliamentCounts } from '@/components/people/TableParliamentCounts'
import { TextHandAliasNote } from '@/components/people/TextHandAliasNote'
import { TextPersonSummary } from '@/components/people/TextPersonSummary'
import { TextSpellingNoteMarker } from '@/components/people/TextSpellingNoteMarker'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FILTER_ALL,
  HTTP_NOT_FOUND,
  NUMBER_LOCALE,
} from '@/constants/constants'
import {
  PERSON_ID_TO_HAND_ALIAS_NOTE,
  PERSON_TITLE_SUFFIX,
  SPELLING_NOTE_NUMBER,
} from '@/constants/people/constants'
import { PersonBillsFilter, PersonReportFilter } from '@/constants/people/enums'
import { useAllPersonBills } from '@/hooks/useAllPersonBills'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatParliament } from '@/lib/format'
import {
  countPersonBills,
  countPersonBillsByParliament,
  groupPersonBillsByParliament,
} from '@/lib/personBills'
import { formatOtherNames, getNameSpellings } from '@/lib/personName'
import {
  getMembershipToPartyNote,
  isSittingMember,
  parsePersonSlug,
} from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'

const personSearchSchema = z.object({
  filter: z
    .union([z.enum(PersonReportFilter), z.enum(PersonBillsFilter)])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/people/$personSlug')({
  validateSearch: personSearchSchema,
  component: function PagePerson() {
    const { personSlug } = Route.useParams()
    const { filter } = Route.useSearch()
    const navigate = useNavigate()
    const { personId, slug } = parsePersonSlug(personSlug)
    const person = useGetPerson({ person_id: personId })
    const reportFilter = filter === PersonBillsFilter.BILLS ? undefined : filter
    const reports = useGetPersonReports({
      person_id: personId,
      filter: reportFilter,
    })
    const { bills } = useAllPersonBills(personId)
    const billGroups =
      bills.data && !bills.hasNextPage
        ? groupPersonBillsByParliament(
            bills.data.pages.flatMap((page) => page.bills)
          )
        : undefined
    const canonicalSlug = person.data?.person_slug
    useDocumentTitle(
      person.data && `${person.data.canonical_name}, ${PERSON_TITLE_SUFFIX}`
    )

    useEffect(
      function redirectToCanonicalSlug() {
        if (canonicalSlug === undefined || canonicalSlug === slug) return
        void navigate({
          to: '/people/$personSlug',
          params: { personSlug: `${personId}-${canonicalSlug}` },
          search: true,
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

    function retryBills() {
      if (bills.isLoadingError) void bills.refetch()
      else void bills.fetchNextPage()
    }

    function changeTab(nextTab: string) {
      void navigate({
        to: '/people/$personSlug',
        params: { personSlug },
        search: (previous) => ({
          ...previous,
          filter: getFilterOfTab(nextTab),
        }),
        resetScroll: false,
      })
    }

    function getFilterOfTab(nextTab: string) {
      if (nextTab === PersonReportFilter.ASKED) return PersonReportFilter.ASKED
      if (nextTab === PersonBillsFilter.BILLS) return PersonBillsFilter.BILLS
      return undefined
    }

    function renderReports(personName: string) {
      if (reports.isLoading || reports.isPlaceholderData) {
        return <SkeletonReportRows />
      }
      if (reports.isLoadingError || !reports.data) {
        return (
          <NoticeErrorPersonReports
            onRetry={retryReports}
            isRetrying={reports.isRefetching}
          />
        )
      }
      const [firstPage] = reports.data.pages
      const personReports = reports.data.pages.flatMap((page) => page.reports)
      const reportCount =
        reportFilter === PersonReportFilter.ASKED
          ? firstPage.questions_asked_count
          : firstPage.total_count
      return (
        <div className="space-y-4">
          <ListPersonReports
            reports={personReports}
            filter={reportFilter}
            personName={personName}
          />
          {reports.hasNextPage && !reports.isFetchNextPageError && (
            <p role="status" className="text-muted-foreground text-sm">
              Showing {personReports.length.toLocaleString(NUMBER_LOCALE)} of{' '}
              {reportCount.toLocaleString(NUMBER_LOCALE)}. More load as you
              scroll.
            </p>
          )}
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

    function renderBills(personName: string) {
      if (bills.isLoadingError || bills.isFetchNextPageError) {
        return (
          <NoticeErrorPersonBills
            onRetry={retryBills}
            isRetrying={bills.isRefetching || bills.isFetchingNextPage}
          />
        )
      }
      if (billGroups === undefined) return <SkeletonReportRows />
      return (
        <ListPersonBillsByParliament
          groups={billGroups}
          personName={personName}
        />
      )
    }

    function renderTabCount(count: number | undefined) {
      if (count === undefined) return null
      return (
        <span className="text-muted-foreground tabular-nums">
          {count.toLocaleString(NUMBER_LOCALE)}
        </span>
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
    const nameSpellings = getNameSpellings(data)
    const otherNames = formatOtherNames(nameSpellings)
    const membershipToPartyNote = getMembershipToPartyNote(
      data.memberships.map((membership) => ({
        label: formatParliament(membership.parliament_number),
        membership,
      })),
      nameSpellings.length > 0 ? SPELLING_NOTE_NUMBER + 1 : undefined
    )
    const firstReportsPage = reports.data?.pages[0]

    return (
      <div className="space-y-8">
        <PageHeader
          title={data.canonical_name}
          badge={isSittingMember(data.memberships) && <BadgeSittingMember />}
          description={
            <TextPersonSummary
              memberships={data.memberships}
              membershipToPartyNote={membershipToPartyNote}
            />
          }
          belowDescription={
            nameVariants === '' && otherNames === '' ? undefined : (
              <p className="text-muted-foreground max-w-prose text-base">
                {otherNames !== '' && (
                  <>
                    {otherNames}
                    <TextSpellingNoteMarker />
                  </>
                )}
                {nameVariants !== '' && otherNames !== '' && <br />}
                {nameVariants !== '' && `Also recorded as: ${nameVariants}`}
              </p>
            )
          }
          titleAction={
            <ButtonCopyLink
              path={`/people/${data.person_id}-${data.person_slug}`}
            />
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
          <TableMemberships
            memberships={data.memberships}
            nameSpellings={nameSpellings}
            membershipToPartyNote={membershipToPartyNote}
          />
        </section>
        {data.parliament_counts.length > 0 && (
          <section aria-labelledby="activity-heading" className="space-y-2">
            <h2
              id="activity-heading"
              className="font-serif text-xl lg:text-2xl"
            >
              Activity
            </h2>
            <TableParliamentCounts
              parliamentCounts={data.parliament_counts}
              parliamentToBillCount={
                billGroups && countPersonBillsByParliament(billGroups)
              }
            />
            <TextHandAliasNote
              personName={data.canonical_name}
              handAliasNote={PERSON_ID_TO_HAND_ALIAS_NOTE[data.person_id]}
            />
          </section>
        )}
        <SectionMemberTimeline personId={data.person_id} />
        <section aria-labelledby="reports-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="reports-heading" className="font-serif text-xl lg:text-2xl">
              Reports
            </h2>
            <Button asChild variant="link" size="sm">
              <Link to="/search" search={{ person: data.person_id }}>
                Search this person's speeches
              </Link>
            </Button>
          </div>
          <Tabs
            value={filter ?? FILTER_ALL}
            onValueChange={changeTab}
            className="gap-4"
          >
            <TabsList className="flex-wrap group-data-[orientation=horizontal]/tabs:h-auto">
              <TabsTrigger value={FILTER_ALL}>
                All reports
                {renderTabCount(firstReportsPage?.total_count)}
              </TabsTrigger>
              <TabsTrigger value={PersonReportFilter.ASKED}>
                Questions asked
                {renderTabCount(firstReportsPage?.questions_asked_count)}
              </TabsTrigger>
              <TabsTrigger value={PersonBillsFilter.BILLS}>
                Bills spoken on
                {renderTabCount(billGroups && countPersonBills(billGroups))}
              </TabsTrigger>
            </TabsList>
            <TabsContent value={FILTER_ALL}>
              {renderReports(data.canonical_name)}
            </TabsContent>
            <TabsContent value={PersonReportFilter.ASKED}>
              {renderReports(data.canonical_name)}
            </TabsContent>
            <TabsContent value={PersonBillsFilter.BILLS}>
              {renderBills(data.canonical_name)}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    )
  },
})
