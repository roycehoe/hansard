import { apiGet } from '@/api/client'
import type { PartyAffiliationData } from '@/types/people/interfaces'
import { useQuery } from '@tanstack/react-query'

export interface GetPersonRequest {
  person_id: number
}

export interface PersonMembershipData {
  parliament_number: number
  party: string
  party_affiliations: PartyAffiliationData[]
  is_legislative_assembly: boolean
  is_member: boolean
  constituencies: string[]
}

export interface ParliamentCountData {
  parliament_number: number
  speech_count: number
  present_count: number
  absent_count: number
}

export interface GetPersonResponse {
  person_id: number
  person_slug: string
  canonical_name: string
  name_variants: string[]
  memberships: PersonMembershipData[]
  parliament_counts: ParliamentCountData[]
}

async function getPersonResponse(
  request: GetPersonRequest
): Promise<GetPersonResponse> {
  return apiGet<GetPersonResponse>(`/people/${request.person_id}`)
}

export function useGetPerson(request: GetPersonRequest) {
  return useQuery({
    queryKey: ['people', request.person_id],
    queryFn: () => getPersonResponse(request),
    enabled: !!request.person_id,
  })
}
