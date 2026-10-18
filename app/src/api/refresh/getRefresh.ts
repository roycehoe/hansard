import { apiGet } from '@/api/client'
import { COVERAGE_STALE_TIME_MILLISECONDS } from '@/constants/coverage/constants'
import { useQuery } from '@tanstack/react-query'

export interface ParliamentGroupFiguresData {
  first_parliament_number: number
  last_parliament_number: number
  linked_row_count: number
  speaker_label_row_count: number
  row_count: number
  named_linked_share: number
  all_linked_share: number
  text_share: number
}

export interface RefreshFiguresData {
  measured_on: string
  groups: ParliamentGroupFiguresData[]
}

export interface GetRefreshResponse {
  latest_sitting_date: string | null
  last_checked_date: string | null
  figures: RefreshFiguresData | null
}

async function getRefreshResponse(): Promise<GetRefreshResponse> {
  return apiGet<GetRefreshResponse>('/refresh')
}

export function useGetRefresh() {
  return useQuery({
    queryKey: ['refresh'],
    queryFn: getRefreshResponse,
    staleTime: COVERAGE_STALE_TIME_MILLISECONDS,
  })
}
