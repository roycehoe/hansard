import { apiGet } from '@/api/client'
import type { ReportType } from '@/constants/reports/enums'
import { useQuery } from '@tanstack/react-query'

export interface GetSittingRequest {
  sitting_date: string
}

export interface SittingReportData {
  report_slug: string
  title: string
  subtitle: string
  report_type: ReportType
  speech_number: number
  is_text_available: boolean
}

export interface AttendanceData {
  name: string
  is_present: boolean
  constituency: string
  person_id: number | null
  person_slug: string
  person_name: string
}

export interface GetSittingResponse {
  sitting_date: string
  parliament_number: number
  volume_number: number
  sitting_number: number | null
  session_number: number | null
  reports: SittingReportData[]
  is_attendance_available: boolean
  attendance: AttendanceData[]
}

async function getSittingResponse(
  request: GetSittingRequest
): Promise<GetSittingResponse> {
  return apiGet<GetSittingResponse>(`/sittings/${request.sitting_date}`)
}

export function useGetSitting(request: GetSittingRequest) {
  return useQuery({
    queryKey: ['sittings', request.sitting_date],
    queryFn: () => getSittingResponse(request),
  })
}
