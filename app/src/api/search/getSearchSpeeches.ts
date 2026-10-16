import { apiGet } from '@/api/client'
import type { ReportType, SpeechKind } from '@/constants/reports/enums'
import type { SearchSort } from '@/constants/search/enums'
import { buildQueryString } from '@/lib/utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface GetSearchSpeechesRequest {
  q?: string
  parliament_number?: number
  date_from?: string
  date_to?: string
  report_type?: ReportType
  person_id?: number
  sort?: SearchSort
  page?: number
}

export interface SpeechMatchData {
  report_slug: string
  title: string
  report_type: ReportType
  sitting_date: string
  parliament_number: number
  ordinal: number
  speaker_label: string
  kind: SpeechKind | null
  person_id: number | null
  person_slug: string
  person_name: string
  snippet: string
}

export interface GetSearchSpeechesResponse {
  results: SpeechMatchData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
  is_total_capped: boolean
}

async function getSearchSpeechesResponse(
  request: GetSearchSpeechesRequest
): Promise<GetSearchSpeechesResponse> {
  return apiGet<GetSearchSpeechesResponse>(
    `/search/speeches${buildQueryString({
      q: request.q === '' ? undefined : request.q,
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

export function useGetSearchSpeeches(
  request: GetSearchSpeechesRequest | undefined
) {
  return useQuery({
    queryKey: [
      'search',
      'speeches',
      request?.q,
      request?.parliament_number,
      request?.date_from,
      request?.date_to,
      request?.report_type,
      request?.person_id,
      request?.sort,
      request?.page,
    ],
    placeholderData: keepPreviousData,
    queryFn: () => getSearchSpeechesResponse(request!),
    enabled: !!request,
  })
}
