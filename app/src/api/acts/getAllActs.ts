import { apiGet } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export interface ActSummaryData {
  sso_code: string
  title: string
}

export interface GetAllActsResponse {
  acts: ActSummaryData[]
}

export type GetAllActsRequest = Record<string, never>

async function getAllActsResponse(): Promise<GetAllActsResponse> {
  return apiGet<GetAllActsResponse>('/acts')
}

export function useGetAllActs(request: GetAllActsRequest | undefined) {
  return useQuery({
    queryKey: ['acts', 'list'],
    queryFn: getAllActsResponse,
    enabled: !!request,
  })
}
