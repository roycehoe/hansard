import { apiGet } from '@/api/client'
import type { ReportType } from '@/constants/reports/enums'
import { useQuery } from '@tanstack/react-query'

export interface GetReportRequest {
  report_slug: string
}

export interface SpeechData {
  ordinal: number
  speaker_label: string
  transcript: string
  person_id: number | null
  person_slug: string
  person_name: string
}

export interface GetReportResponse {
  report_slug: string
  title: string
  subtitle: string
  report_type: ReportType
  parliament_number: number
  volume_number: number
  sitting_number: number | null
  sitting_date: string
  official_record_url: string
  is_text_available: boolean
  speeches: SpeechData[]
}

async function getReportResponse(
  request: GetReportRequest
): Promise<GetReportResponse> {
  return apiGet<GetReportResponse>(
    `/reports/${encodeURIComponent(request.report_slug)}`
  )
}

export function useGetReport(request: GetReportRequest) {
  return useQuery({
    queryKey: ['reports', request.report_slug],
    queryFn: () => getReportResponse(request),
  })
}
