import { apiGet } from '@/api/client'
import type { PersonReportFilter } from '@/constants/people/enums'
import type { ReportType } from '@/constants/reports/enums'
import { buildQueryString } from '@/lib/utils'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'

export interface GetPersonReportsRequest {
  person_id: number
  filter?: PersonReportFilter
}

export interface PersonReportData {
  report_slug: string
  title: string
  subtitle: string
  report_type: ReportType
  sitting_date: string
  parliament_number: number
  speech_count: number
}

export interface GetPersonReportsResponse {
  reports: PersonReportData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
  questions_asked_count: number
}

const FIRST_PAGE = 1

async function getPersonReportsResponse(
  request: GetPersonReportsRequest,
  page: number
): Promise<GetPersonReportsResponse> {
  return apiGet<GetPersonReportsResponse>(
    `/people/${request.person_id}/reports${buildQueryString({ page, filter: request.filter })}`
  )
}

export function useGetPersonReports(request: GetPersonReportsRequest) {
  return useInfiniteQuery({
    queryKey: ['people', request.person_id, 'reports', request.filter],
    placeholderData: (
      previousData: InfiniteData<GetPersonReportsResponse, number> | undefined,
      previousQuery
    ) =>
      previousQuery?.queryKey[1] === request.person_id
        ? previousData
        : undefined,
    queryFn: ({ pageParam }) => getPersonReportsResponse(request, pageParam),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.has_next_page ? lastPage.page + 1 : undefined,
    enabled: !!request.person_id,
  })
}
