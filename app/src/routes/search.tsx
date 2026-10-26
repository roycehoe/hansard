import { ApiError } from '@/api/client'
import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import { useGetPerson } from '@/api/people/getPerson'
import { useGetSearchReports } from '@/api/search/getSearchReports'
import type {
  GetSearchSpeechesRequest,
  GetSearchSpeechesResponse,
} from '@/api/search/getSearchSpeeches'
import { useGetSearchSpeeches } from '@/api/search/getSearchSpeeches'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationInfiniteScroll } from '@/components/layout/PaginationInfiniteScroll'
import type { FormSearchValues } from '@/components/search/FormSearch'
import { FormSearch } from '@/components/search/FormSearch'
import { ListActiveFilters } from '@/components/search/ListActiveFilters'
import { ListPersonMatches } from '@/components/search/ListPersonMatches'
import { ListReportMatches } from '@/components/search/ListReportMatches'
import { ListSpeechMatches } from '@/components/search/ListSpeechMatches'
import { NoticeErrorParliaments } from '@/components/search/NoticeErrorParliaments'
import { NoticeErrorSearch } from '@/components/search/NoticeErrorSearch'
import { NoticeErrorSearchBusy } from '@/components/search/NoticeErrorSearchBusy'
import { NoticeErrorSearchExcludedWordsOnly } from '@/components/search/NoticeErrorSearchExcludedWordsOnly'
import { NoticeErrorSearchTimedOut } from '@/components/search/NoticeErrorSearchTimedOut'
import { NoticeSearchConstituencyNotFound } from '@/components/search/NoticeSearchConstituencyNotFound'
import { NoticeSearchWordsTooLong } from '@/components/search/NoticeSearchWordsTooLong'
import { SkeletonFormSearch } from '@/components/search/SkeletonFormSearch'
import { SkeletonSearchResults } from '@/components/search/SkeletonSearchResults'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FILTER_ALL,
  HTTP_TOO_MANY_REQUESTS,
  NUMBER_LOCALE,
} from '@/constants/constants'
import { ReportType } from '@/constants/reports/enums'
import {
  REPORTS_HEADING,
  SEARCH_WORDS_INPUT_ID,
  SEARCH_WORDS_MAX_LENGTH,
  SPEECH_MATCHES_HEADING,
  SPEECHES_HEADING,
  TITLE_MATCHES_HEADING,
} from '@/constants/search/constants'
import { SearchSort, SearchTab } from '@/constants/search/enums'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isQueryOnlyExcludedWords } from '@/lib/searchQuery'
import {
  getSortWithoutWords,
  isSearchConstituencyNotFoundError,
  isSearchExcludedWordsOnlyError,
  isSearchTimedOutError,
  mapFilterToSearchValue,
  removeConstituencySuffix,
} from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

function getSpeechesHeading(
  hasWords: boolean,
  personName: string | undefined,
  constituency: string | undefined
): string {
  if (hasWords) return SPEECH_MATCHES_HEADING
  if (personName !== undefined) return `${SPEECHES_HEADING} by ${personName}`
  if (constituency !== undefined) {
    return `${SPEECHES_HEADING} by members for ${constituency}`
  }
  return SPEECHES_HEADING
}

function isSearchBusyError(error: Error | null): boolean {
  return error instanceof ApiError && error.status === HTTP_TOO_MANY_REQUESTS
}

const searchSearchSchema = z.object({
  q: z.string().optional(),
  parliament: z.coerce.number().int().min(0).optional(),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  type: z.enum(ReportType).optional(),
  person: z.coerce.number().int().min(1).optional(),
  constituency: z.string().trim().min(1).optional().catch(undefined),
  sort: z.enum(SearchSort).optional(),
  tab: z.enum(SearchTab).optional().catch(undefined),
})

const SEARCH_SKELETON_ROW_COUNT = 5

const NEXT_PAGE_SKELETON_ROW_COUNT = 3

export const Route = createFileRoute('/search')({
  validateSearch: searchSearchSchema,
  component: function PageSearch() {
    const { q, parliament, from, to, type, person, constituency, sort, tab } =
      Route.useSearch()
    const navigate = useNavigate()
    const parliaments = useGetAllParliaments()
    const personDetail = useGetPerson({ person_id: person ?? 0 })
    const words = q?.trim() ?? ''
    const hasPerson = person !== undefined
    const hasConstituency = constituency !== undefined
    const hasWords =
      words !== '' &&
      !(isQueryOnlyExcludedWords(words) && (hasPerson || hasConstituency))
    const hasFilter =
      parliament !== undefined ||
      !!from ||
      !!to ||
      type !== undefined ||
      hasPerson ||
      hasConstituency
    const isWordsTooLong = words.length > SEARCH_WORDS_MAX_LENGTH
    const canSearch = (hasWords || hasFilter) && !isWordsTooLong
    // NOTE: a report title carries no seat, so a seat filter leaves only the speeches
    const canSearchReports =
      canSearch && !hasConstituency && (hasWords || !hasPerson)
    const resultSort = hasWords ? sort : getSortWithoutWords(sort)
    const personName = personDetail.data?.canonical_name
    const speechesHeading = getSpeechesHeading(
      hasWords,
      personName,
      constituency
    )
    const reportsHeading = hasWords ? TITLE_MATCHES_HEADING : REPORTS_HEADING
    useDocumentTitle(
      ...(hasWords
        ? [words, 'Search']
        : hasPerson || hasConstituency
          ? [speechesHeading, 'Search']
          : ['Search'])
    )
    const speechesRequest: GetSearchSpeechesRequest = {
      q: words,
      parliament_number: parliament,
      date_from: from,
      date_to: to,
      report_type: type,
      person_id: person,
      constituency:
        constituency === undefined
          ? undefined
          : removeConstituencySuffix(constituency),
      sort: resultSort,
    }
    const speeches = useGetSearchSpeeches(
      canSearch ? speechesRequest : undefined
    )
    const reports = useGetSearchReports(
      canSearchReports
        ? {
            q: words,
            parliament_number: parliament,
            date_from: from,
            date_to: to,
            report_type: type,
            is_text_available: hasPerson ? false : undefined,
            sort: resultSort,
          }
        : undefined
    )

    function retryParliaments() {
      void parliaments.refetch()
    }

    function retrySpeeches() {
      void speeches.refetch()
    }

    function retryReports() {
      void reports.refetch()
    }

    function applySearch(values: FormSearchValues) {
      const parliamentValue = mapFilterToSearchValue(values.parliament)
      void navigate({
        to: '/search',
        search: {
          q: values.q.trim() === '' ? undefined : values.q.trim(),
          parliament:
            parliamentValue === undefined ? undefined : Number(parliamentValue),
          from: mapFilterToSearchValue(values.from),
          to: mapFilterToSearchValue(values.to),
          type: values.type === FILTER_ALL ? undefined : values.type,
          person: values.person ?? undefined,
          constituency: mapFilterToSearchValue(values.constituency.trim()),
          sort: values.sort,
          tab,
        },
      })
    }

    function clearFilters() {
      document.getElementById(SEARCH_WORDS_INPUT_ID)?.focus()
      void navigate({
        to: '/search',
        search: {
          q,
          sort,
          tab,
        },
      })
    }

    function loadMoreSpeeches() {
      void speeches.fetchNextPage()
    }

    function loadMoreReports() {
      void reports.fetchNextPage()
    }

    function changeTab(nextTab: string) {
      void navigate({
        to: '/search',
        search: (previous) => ({
          ...previous,
          tab:
            nextTab === SearchTab.SPEECHES ? undefined : (nextTab as SearchTab),
        }),
        resetScroll: false,
      })
    }

    function renderForm() {
      if (parliaments.isLoading) return <SkeletonFormSearch />
      if (parliaments.isLoadingError || !parliaments.data) {
        return (
          <NoticeErrorParliaments
            onRetry={retryParliaments}
            isRetrying={parliaments.isRefetching}
          />
        )
      }
      return (
        <FormSearch
          defaultValues={{
            q: q ?? '',
            parliament:
              parliament === undefined ? FILTER_ALL : String(parliament),
            type: type ?? FILTER_ALL,
            from: from ?? '',
            to: to ?? '',
            person: person ?? null,
            constituency: constituency ?? '',
            sort: sort ?? SearchSort.RELEVANCE,
          }}
          parliaments={parliaments.data.parliaments}
          onSubmit={applySearch}
        />
      )
    }

    function renderSpeeches() {
      if (speeches.isLoading)
        return <SkeletonSearchResults rowCount={SEARCH_SKELETON_ROW_COUNT} />
      if (speeches.isLoadingError || !speeches.data) {
        if (isSearchConstituencyNotFoundError(speeches.error))
          return (
            <NoticeSearchConstituencyNotFound
              constituency={constituency ?? ''}
            />
          )
        if (isSearchTimedOutError(speeches.error))
          return <NoticeErrorSearchTimedOut />
        if (isSearchExcludedWordsOnlyError(speeches.error))
          return <NoticeErrorSearchExcludedWordsOnly />
        if (isSearchBusyError(speeches.error)) {
          return (
            <NoticeErrorSearchBusy
              onRetry={retrySpeeches}
              isRetrying={speeches.isRefetching}
            />
          )
        }
        return (
          <NoticeErrorSearch
            onRetry={retrySpeeches}
            isRetrying={speeches.isRefetching}
          />
        )
      }
      const [firstPage] = speeches.data.pages
      const results = speeches.data.pages.flatMap((page) => page.results)
      return (
        <div className="space-y-4">
          <ListSpeechMatches
            resultPages={speeches.data.pages.map((page) => page.results)}
            searchRequest={speechesRequest}
            hasWords={hasWords}
            highlightWords={hasWords ? words : undefined}
            totalCount={firstPage.total_count}
            isTotalCapped={firstPage.is_total_capped}
          />
          <PaginationInfiniteScroll
            hasNextPage={speeches.hasNextPage && !speeches.isPlaceholderData}
            isFetchingNextPage={speeches.isFetchingNextPage}
            isFetchNextPageError={speeches.isFetchNextPageError}
            onLoadMore={loadMoreSpeeches}
            loadingRows={
              <SkeletonSearchResults rowCount={NEXT_PAGE_SKELETON_ROW_COUNT} />
            }
            shownCount={results.length}
            totalCount={firstPage.total_count}
            isTotalCapped={firstPage.is_total_capped}
          />
        </div>
      )
    }

    function renderReports() {
      if (reports.isLoading)
        return <SkeletonSearchResults rowCount={SEARCH_SKELETON_ROW_COUNT} />
      if (reports.isLoadingError || !reports.data) {
        if (isSearchTimedOutError(reports.error))
          return <NoticeErrorSearchTimedOut />
        if (isSearchExcludedWordsOnlyError(reports.error))
          return <NoticeErrorSearchExcludedWordsOnly />
        if (isSearchBusyError(reports.error)) {
          return (
            <NoticeErrorSearchBusy
              onRetry={retryReports}
              isRetrying={reports.isRefetching}
            />
          )
        }
        return (
          <NoticeErrorSearch
            onRetry={retryReports}
            isRetrying={reports.isRefetching}
          />
        )
      }
      const [firstPage] = reports.data.pages
      const results = reports.data.pages.flatMap((page) => page.results)
      return (
        <div className="space-y-4">
          <ListReportMatches
            results={results}
            hasWords={hasWords}
            highlightWords={hasWords ? words : undefined}
            totalCount={firstPage.total_count}
            isTotalCapped={firstPage.is_total_capped}
          />
          <PaginationInfiniteScroll
            hasNextPage={reports.hasNextPage && !reports.isPlaceholderData}
            isFetchingNextPage={reports.isFetchingNextPage}
            isFetchNextPageError={reports.isFetchNextPageError}
            onLoadMore={loadMoreReports}
            loadingRows={
              <SkeletonSearchResults rowCount={NEXT_PAGE_SKELETON_ROW_COUNT} />
            }
            shownCount={results.length}
            totalCount={firstPage.total_count}
            isTotalCapped={firstPage.is_total_capped}
          />
        </div>
      )
    }

    function renderTabCount(
      firstPage:
        | Pick<GetSearchSpeechesResponse, 'total_count' | 'is_total_capped'>
        | undefined
    ) {
      if (firstPage === undefined) return null
      const count = firstPage.total_count.toLocaleString(NUMBER_LOCALE)
      return (
        <span className="text-muted-foreground tabular-nums">
          {firstPage.is_total_capped ? `${count}+` : count}
        </span>
      )
    }

    function renderResults() {
      if (!canSearchReports) {
        return (
          <section
            aria-labelledby="speech-matches-heading"
            className="space-y-4"
          >
            <h2
              id="speech-matches-heading"
              className="font-serif text-xl lg:text-2xl"
            >
              {speechesHeading}
            </h2>
            {renderSpeeches()}
          </section>
        )
      }
      return (
        <Tabs
          value={tab ?? SearchTab.SPEECHES}
          onValueChange={changeTab}
          className="gap-4"
        >
          <TabsList variant="line">
            <TabsTrigger value={SearchTab.SPEECHES}>
              {speechesHeading}
              {renderTabCount(speeches.data?.pages[0])}
            </TabsTrigger>
            <TabsTrigger value={SearchTab.TITLES}>
              {reportsHeading}
              {renderTabCount(reports.data?.pages[0])}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={SearchTab.SPEECHES}>
            {renderSpeeches()}
          </TabsContent>
          <TabsContent value={SearchTab.TITLES}>{renderReports()}</TabsContent>
        </Tabs>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Search"
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
                  <BreadcrumbPage>Search</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        {renderForm()}
        <ListActiveFilters onClearFilters={clearFilters} />
        {isWordsTooLong && <NoticeSearchWordsTooLong />}
        {!isWordsTooLong && (
          <ListPersonMatches words={words} hasPerson={hasPerson} />
        )}
        {canSearch && renderResults()}
      </div>
    )
  },
})
