import { apiGet } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export interface ParliamentData {
  parliament_number: number
  sitting_count: number
  report_count: number
  text_report_count: number
  first_sitting_date: string
  last_sitting_date: string
}

export interface GetAllParliamentsResponse {
  parliaments: ParliamentData[]
}

async function getAllParliamentsResponse(): Promise<GetAllParliamentsResponse> {
  return apiGet<GetAllParliamentsResponse>('/parliaments')
}

export function useGetAllParliaments() {
  return useQuery({
    queryKey: ['parliaments'],
    queryFn: getAllParliamentsResponse,
  })
}
