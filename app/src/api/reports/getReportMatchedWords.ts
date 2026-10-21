import { apiGet } from '@/api/client'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetReportMatchedWordsRequest {
  report_slug: string
  q: string
}

export interface GetReportMatchedWordsResponse {
  words: string[]
}

async function getReportMatchedWordsResponse(
  request: GetReportMatchedWordsRequest
): Promise<GetReportMatchedWordsResponse> {
  return apiGet<GetReportMatchedWordsResponse>(
    `/reports/${encodeURIComponent(request.report_slug)}/matched-words${buildQueryString({ q: request.q })}`
  )
}

export function useGetReportMatchedWords(
  request: GetReportMatchedWordsRequest
) {
  return useQuery({
    queryKey: ['reports', request.report_slug, 'matched-words', request.q],
    queryFn: () => getReportMatchedWordsResponse(request),
    enabled: !!request.q,
  })
}
