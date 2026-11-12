import type { ReportType } from '@/constants/reports/enums'

export interface ReportLinkData {
  relation: 'corrects' | 'corrected_by' | 'refers_to' | 'continues'
  report_slug: string
  title: string
  subtitle: string
  report_type: ReportType
  sitting_date: string
  printed_citation: string
}

export interface GetReportLinksResponse {
  links: ReportLinkData[]
}
