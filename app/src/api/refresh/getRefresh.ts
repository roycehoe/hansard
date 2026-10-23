import { apiGet } from '@/api/client'
import { COVERAGE_STALE_TIME_MILLISECONDS } from '@/constants/coverage/constants'
import { useQuery } from '@tanstack/react-query'

export interface GetRefreshResponse {
  latest_sitting_date: string | null
  last_checked_date: string | null
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
