export interface SeatHolderData {
  person_id: number | null
  person_name: string | null
  parliament_number: number
  party: string
  location_name: string
  first_sitting_date: string
  last_sitting_date: string
  sitting_count: number
}

export interface GetSeatHistoryResponse {
  constituency: string
  holders: SeatHolderData[]
}
