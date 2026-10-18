import { apiGet } from '@/api/client'
import { buildQueryString } from '@/lib/utils'
import type { PartyAffiliationData } from '@/types/people/interfaces'
import { useQuery } from '@tanstack/react-query'

export interface GetAllPersonsRequest {
  parliament_number?: number
  party?: string
  name?: string
}

export interface MembershipData {
  parliament_number: number
  party: string
  party_affiliations: PartyAffiliationData[]
  is_legislative_assembly: boolean
  is_member: boolean
}

export interface PersonData {
  person_id: number
  person_slug: string
  canonical_name: string
  memberships: MembershipData[]
}

export interface GetAllPersonsResponse {
  persons: PersonData[]
}

async function getAllPersonsResponse(
  request: GetAllPersonsRequest
): Promise<GetAllPersonsResponse> {
  return apiGet<GetAllPersonsResponse>(
    `/people${buildQueryString({
      parliament_number: request.parliament_number,
      party: request.party,
      name: request.name,
    })}`
  )
}

export function useGetAllPersons(request: GetAllPersonsRequest | undefined) {
  return useQuery({
    queryKey: [
      'people',
      'list',
      request?.parliament_number,
      request?.party,
      request?.name,
    ],
    queryFn: () => getAllPersonsResponse(request!),
    enabled: !!request,
  })
}
