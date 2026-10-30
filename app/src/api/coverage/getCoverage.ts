import { apiGet } from '@/api/client'
import { COVERAGE_STALE_TIME_MILLISECONDS } from '@/constants/coverage/constants'
import { useQuery } from '@tanstack/react-query'

export interface YearCoverageData {
  year: number
  report_count: number
  text_report_count: number
}

export interface ParliamentGroupFiguresData {
  first_parliament_number: number
  last_parliament_number: number
  linked_row_count: number
  speaker_label_row_count: number
  row_count: number
  named_linked_share: number
  all_linked_share: number
  text_share: number
}

export interface AttributionFiguresData {
  measured_on: string
  groups: ParliamentGroupFiguresData[]
}

export interface GetCoverageResponse {
  report_count: number
  text_report_count: number
  no_text_by_design_report_count: number
  speech_count: number
  linked_speech_count: number
  person_count: number
  membership_count: number
  non_member_membership_count: number
  non_member_person_count: number
  sitting_count: number
  attendance_count: number
  linked_attendance_count: number
  first_sitting_date: string | null
  last_sitting_date: string | null
  text_first_sitting_date: string | null
  text_last_sitting_date: string | null
  attendance_last_sitting_date: string | null
  years: YearCoverageData[]
  attribution: AttributionFiguresData | null
}

async function getCoverageResponse(): Promise<GetCoverageResponse> {
  return apiGet<GetCoverageResponse>('/coverage')
}

export function useGetCoverage() {
  return useQuery({
    queryKey: ['coverage'],
    queryFn: getCoverageResponse,
    staleTime: COVERAGE_STALE_TIME_MILLISECONDS,
  })
}
