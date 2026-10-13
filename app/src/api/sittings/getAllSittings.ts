import { apiGet } from '@/api/client'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetAllSittingsRequest {
  parliament_number?: number
}

export interface SittingData {
  sitting_date: string
  parliament_number: number
  volume_number: number
  sitting_number: number | null
  session_number: number | null
  report_count: number
}

export interface GetAllSittingsResponse {
  sittings: SittingData[]
}

async function getAllSittingsResponse(
  request: GetAllSittingsRequest
): Promise<GetAllSittingsResponse> {
  return apiGet<GetAllSittingsResponse>(
    `/sittings${buildQueryString({ parliament_number: request.parliament_number })}`
  )
}

export function useGetAllSittings(request: GetAllSittingsRequest) {
  return useQuery({
    queryKey: ['sittings', 'list', request.parliament_number],
    queryFn: () => getAllSittingsResponse(request),
    enabled: request.parliament_number !== undefined,
  })
}
