import { apiGet } from '@/api/client'
import type { BillReportRole } from '@/constants/bills/enums'
import { buildQueryString } from '@/lib/utils'
import { useInfiniteQuery } from '@tanstack/react-query'

export interface GetPersonBillsRequest {
  person_id: number
}

export interface PersonBillReportData {
  report_slug: string
  sitting_date: string
  parliament_number: number
  role: BillReportRole
}

export interface PersonBillData {
  bill_key: string
  title: string
  first_sitting_date: string
  last_sitting_date: string
  is_passed: boolean
  act_count: number
  printed_speakers: string[]
  reading_speech_count: number
  budget_debate_speech_count: number
  reading_report_count: number
  budget_debate_report_count: number
  reports: PersonBillReportData[]
}

export interface GetPersonBillsResponse {
  bills: PersonBillData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
}

const FIRST_PAGE = 1

const PAGE_SIZE = 100

async function getPersonBillsResponse(
  request: GetPersonBillsRequest,
  page: number
): Promise<GetPersonBillsResponse> {
  return apiGet<GetPersonBillsResponse>(
    `/people/${request.person_id}/bills${buildQueryString({ page, page_size: PAGE_SIZE })}`
  )
}

export function useGetPersonBills(request: GetPersonBillsRequest) {
  return useInfiniteQuery({
    queryKey: ['people', request.person_id, 'bills'],
    queryFn: ({ pageParam }) => getPersonBillsResponse(request, pageParam),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.has_next_page ? lastPage.page + 1 : undefined,
    enabled: !!request.person_id,
  })
}
