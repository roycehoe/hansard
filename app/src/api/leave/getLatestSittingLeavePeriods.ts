export interface LatestSittingLeaveData {
  person_id: number | null
  person_name: string | null
  name: string | null
  start_date: string | null
  end_date: string | null
  end_text: string | null
  printed_name: string | null
  carried_name: string | null
  printed_from: string | null
  printed_to: string | null
  office_printed: string | null
  office_source: string | null
}

export interface GetLatestSittingLeavePeriodsResponse {
  sitting_date: string | null
  leave_periods: LatestSittingLeaveData[]
}
