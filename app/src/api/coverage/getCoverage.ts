import { apiGet } from '@/api/client'
import { COVERAGE_STALE_TIME_MILLISECONDS } from '@/constants/search/constants'
import { useQuery } from '@tanstack/react-query'

export interface YearCoverageData {
  year: number
  report_count: number
  text_report_count: number
}

export interface GetCoverageResponse {
  report_count: number
  text_report_count: number
  speech_count: number
  linked_speech_count: number
  person_count: number
  membership_count: number
  sitting_count: number
  attendance_count: number
  linked_attendance_count: number
  text_first_sitting_date: string | null
  text_last_sitting_date: string | null
  attendance_last_sitting_date: string | null
  years: YearCoverageData[]
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
