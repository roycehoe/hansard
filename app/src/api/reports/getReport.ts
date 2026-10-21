import { apiGet } from '@/api/client'
import type {
  ReportType,
  SpeechKind,
  SpeechLinkStatus,
} from '@/constants/reports/enums'
import { buildQueryString } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export interface GetReportRequest {
  report_slug: string
  s?: number
  q?: string
}

export interface SpeechData {
  ordinal: number
  speaker_label: string
  transcript: string
  kind: SpeechKind | null
  person_id: number | null
  person_slug: string
  person_name: string
  is_shared_role_credit: boolean
  anchor: string
}

export interface SpeechLinkData {
  status: SpeechLinkStatus
  ordinal: number | null
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
  speech_link: SpeechLinkData | null
}

async function getReportResponse(
  request: GetReportRequest
): Promise<GetReportResponse> {
  return apiGet<GetReportResponse>(
    `/reports/${encodeURIComponent(request.report_slug)}${buildQueryString({ s: request.s, q: request.q })}`
  )
}

export function useGetReport(request: GetReportRequest) {
  return useQuery({
    queryKey: ['reports', request.report_slug, request.s, request.q],
    queryFn: () => getReportResponse(request),
  })
}
