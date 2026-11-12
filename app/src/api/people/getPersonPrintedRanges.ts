import type { PrintedRangeData } from '@/api/offices/getOffices'

export interface PersonPrintedRangesMembershipData {
  membership_id: number
  parliament_number: number
  ranges: PrintedRangeData[]
}

export interface GetPersonPrintedRangesResponse {
  person_id: number
  memberships: PersonPrintedRangesMembershipData[]
}
