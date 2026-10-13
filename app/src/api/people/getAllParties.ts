import { apiGet } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export interface GetAllPartiesResponse {
  parties: string[]
}

async function getAllPartiesResponse(): Promise<GetAllPartiesResponse> {
  return apiGet<GetAllPartiesResponse>('/parties')
}

export function useGetAllParties() {
  return useQuery({
    queryKey: ['parties'],
    queryFn: getAllPartiesResponse,
  })
}
