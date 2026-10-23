import { apiGet } from '@/api/client'
import type {
  GetSearchSpeechesRequest,
  GetSearchSpeechesResponse,
} from '@/api/search/getSearchSpeeches'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetSearchSpeechesByReportRequest extends GetSearchSpeechesRequest {
  report: string
}

const REPORT_MATCHES_PAGE_SIZE = 100

const SEARCH_STALE_TIME = 5 * 60 * 1000

async function getSearchSpeechesByReportResponse(
  request: GetSearchSpeechesByReportRequest
): Promise<GetSearchSpeechesResponse> {
  return apiGet<GetSearchSpeechesResponse>(
    `/search/speeches${buildQueryString({
      q: request.q === '' ? undefined : request.q,
      parliament_number: request.parliament_number,
      date_from: request.date_from,
      date_to: request.date_to,
      report_type: request.report_type,
      person_id: request.person_id,
      constituency: request.constituency,
      report: request.report,
      sort: request.sort,
      page_size: REPORT_MATCHES_PAGE_SIZE,
    })}`
  )
}

export function useGetSearchSpeechesByReport(
  request: GetSearchSpeechesByReportRequest | undefined
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
      request?.constituency,
      request?.sort,
      request?.report,
    ],
    queryFn: () => getSearchSpeechesByReportResponse(request!),
    staleTime: SEARCH_STALE_TIME,
    enabled: !!request,
  })
}
