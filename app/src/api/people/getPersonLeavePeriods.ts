export interface LeavePrintingData {
  sitting_date: string
  entry_format: string
  name_source: string
  year_source: string | null
  printed_name: string | null
  carried_name: string | null
  printed_from: string | null
  printed_to: string | null
  printed_line: string | null
  printed_heading_from: string | null
  printed_heading_to: string | null
  office_printed: string | null
  office_source: string | null
  is_covering_sitting: boolean | null
}

export interface PersonLeavePeriodData {
  name: string | null
  start_date: string | null
  end_date: string | null
  end_text: string | null
  printings: LeavePrintingData[]
}

export interface GetPersonLeavePeriodsResponse {
  leave_periods: PersonLeavePeriodData[]
}
