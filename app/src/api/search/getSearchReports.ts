import { apiGet } from '@/api/client'
import type { ReportType } from '@/constants/reports/enums'
import type { SearchSort } from '@/constants/search/enums'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetSearchReportsRequest {
  q: string
  parliament_number?: number
  date_from?: string
  date_to?: string
  report_type?: ReportType
  person_id?: number
  sort?: SearchSort
  page?: number
}

export interface ReportMatchData {
  report_slug: string
  title: string
  report_type: ReportType
  sitting_date: string
  parliament_number: number
  is_text_available: boolean
  snippet: string
}

export interface GetSearchReportsResponse {
  results: ReportMatchData[]
  page: number
  page_size: number
  has_next_page: boolean
}

async function getSearchReportsResponse(
  request: GetSearchReportsRequest
): Promise<GetSearchReportsResponse> {
  return apiGet<GetSearchReportsResponse>(
    `/search/reports${buildQueryString({
      q: request.q,
      parliament_number: request.parliament_number,
      date_from: request.date_from,
      date_to: request.date_to,
      report_type: request.report_type,
      person_id: request.person_id,
      sort: request.sort,
      page: request.page,
    })}`
  )
}

export function useGetSearchReports(request: GetSearchReportsRequest) {
  return useQuery({
    queryKey: [
      'search',
      'reports',
      request.q,
      request.parliament_number,
      request.date_from,
      request.date_to,
      request.report_type,
      request.person_id,
      request.sort,
      request.page,
    ],
    queryFn: () => getSearchReportsResponse(request),
    enabled: !!request.q,
  })
}
