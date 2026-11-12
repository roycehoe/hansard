import { apiGet } from '@/api/client'
import type { PrintedRangeData } from '@/api/offices/getOffices'
import { useQuery } from '@tanstack/react-query'

export interface GetPersonPrintedRangesRequest {
  person_id: number
}

export interface PersonPrintedRangesMembershipData {
  membership_id: number
  parliament_number: number
  ranges: PrintedRangeData[]
}

export interface GetPersonPrintedRangesResponse {
  person_id: number
  memberships: PersonPrintedRangesMembershipData[]
}

async function getPersonPrintedRangesResponse(
  request: GetPersonPrintedRangesRequest
): Promise<GetPersonPrintedRangesResponse> {
  return apiGet<GetPersonPrintedRangesResponse>(
    `/people/${request.person_id}/printed-ranges`
  )
}

export function useGetPersonPrintedRanges(
  request: GetPersonPrintedRangesRequest
) {
  return useQuery({
    queryKey: ['people', request.person_id, 'printed-ranges'],
    queryFn: () => getPersonPrintedRangesResponse(request),
    enabled: !!request.person_id,
  })
}
