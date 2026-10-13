import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import { useGetSearchReports } from '@/api/search/getSearchReports'
import { useGetSearchSpeeches } from '@/api/search/getSearchSpeeches'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaginationPrevNext } from '@/components/layout/PaginationPrevNext'
import { BadgePersonFilter } from '@/components/search/BadgePersonFilter'
import type { FormSearchValues } from '@/components/search/FormSearch'
import { FormSearch } from '@/components/search/FormSearch'
import { ListReportMatches } from '@/components/search/ListReportMatches'
import { ListSpeechMatches } from '@/components/search/ListSpeechMatches'
import { NoticeErrorParliaments } from '@/components/search/NoticeErrorParliaments'
import { NoticeErrorSearch } from '@/components/search/NoticeErrorSearch'
import { NoticeTextCoverage } from '@/components/search/NoticeTextCoverage'
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
import { ReportType } from '@/constants/reports/enums'
import { SearchSort } from '@/constants/search/enums'
import { mapFilterToSearchValue } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const FIRST_PAGE = 1

const searchSearchSchema = z.object({
  q: z.string().optional(),
  parliament: z.coerce.number().int().min(0).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(ReportType).optional(),
  person: z.coerce.number().int().min(1).optional(),
  sort: z.enum(SearchSort).optional(),
  page: z.coerce.number().int().min(FIRST_PAGE).optional(),
  title_page: z.coerce.number().int().min(FIRST_PAGE).optional(),
})

export const Route = createFileRoute('/search')({
  validateSearch: searchSearchSchema,
  component: function PageSearch() {
    const {
      q,
      parliament,
      from,
      to,
      type,
      person,
      sort,
      page = FIRST_PAGE,
      title_page: titlePage = FIRST_PAGE,
    } = Route.useSearch()
    const navigate = useNavigate()
    const parliaments = useGetAllParliaments()
    const request = {
      q: q ?? '',
      parliament_number: parliament,
      date_from: from,
      date_to: to,
      report_type: type,
      person_id: person,
      sort,
    }
    const speeches = useGetSearchSpeeches({ ...request, page })
    const reports = useGetSearchReports({
      q: request.q,
      parliament_number: parliament,
      date_from: from,
      date_to: to,
      report_type: type,
      is_text_available: person === undefined ? undefined : false,
      sort,
      page: titlePage,
    })
    const hasQuery = q !== undefined && q !== ''

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
          q: values.q.trim(),
          parliament:
            parliamentValue === undefined ? undefined : Number(parliamentValue),
          from: mapFilterToSearchValue(values.from),
          to: mapFilterToSearchValue(values.to),
          type: values.type === FILTER_ALL ? undefined : values.type,
          person,
          sort: values.sort,
          page: undefined,
          title_page: undefined,
        },
      })
    }

    function changeSpeechPage(nextPage: number) {
      void navigate({
        to: '/search',
        search: (previous) => ({
          ...previous,
          page: nextPage === FIRST_PAGE ? undefined : nextPage,
        }),
      })
    }

    function changeReportPage(nextPage: number) {
      void navigate({
        to: '/search',
        search: (previous) => ({
          ...previous,
          title_page: nextPage === FIRST_PAGE ? undefined : nextPage,
        }),
      })
    }

    function renderForm() {
      if (parliaments.isLoading) return <Skeleton className="h-40 w-full" />
      if (parliaments.isError || !parliaments.data) {
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
            sort: sort ?? SearchSort.RELEVANCE,
          }}
          parliaments={parliaments.data.parliaments}
          onSubmit={applySearch}
        />
      )
    }

    function renderSpeeches() {
      if (speeches.isLoading) return <Skeleton className="h-64 w-full" />
      if (speeches.isError || !speeches.data) {
        return (
          <NoticeErrorSearch
            onRetry={retrySpeeches}
            isRetrying={speeches.isRefetching}
          />
        )
      }
      return (
        <div className="space-y-4">
          <ListSpeechMatches results={speeches.data.results} />
          <PaginationPrevNext
            page={page}
            hasNextPage={speeches.data.has_next_page}
            onPageChange={changeSpeechPage}
            ariaLabel="Speech matches pages"
          />
        </div>
      )
    }

    function renderReports() {
      if (reports.isLoading) return <Skeleton className="h-64 w-full" />
      if (reports.isError || !reports.data) {
        return (
          <NoticeErrorSearch
            onRetry={retryReports}
            isRetrying={reports.isRefetching}
          />
        )
      }
      return (
        <div className="space-y-4">
          <ListReportMatches results={reports.data.results} />
          <PaginationPrevNext
            page={titlePage}
            hasNextPage={reports.data.has_next_page}
            onPageChange={changeReportPage}
            ariaLabel="Title matches pages"
          />
        </div>
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
        {person !== undefined && <BadgePersonFilter personId={person} />}
        <NoticeTextCoverage />
        {hasQuery && (
          <>
            {renderSpeeches()}
            {renderReports()}
          </>
        )}
      </div>
    )
  },
})
