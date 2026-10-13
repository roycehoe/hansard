import { apiGet } from '@/api/client'
import type { ReportType } from '@/constants/reports/enums'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetPersonReportsRequest {
  person_id: number
  page?: number
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
}

async function getPersonReportsResponse(
  request: GetPersonReportsRequest
): Promise<GetPersonReportsResponse> {
  return apiGet<GetPersonReportsResponse>(
    `/people/${request.person_id}/reports${buildQueryString({ page: request.page })}`
  )
}

export function useGetPersonReports(request: GetPersonReportsRequest) {
  return useQuery({
    queryKey: ['people', request.person_id, 'reports', request.page],
    queryFn: () => getPersonReportsResponse(request),
    enabled: !!request.person_id,
  })
}
