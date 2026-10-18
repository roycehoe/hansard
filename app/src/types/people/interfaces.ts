import type { DatePrecision } from '@/constants/people/enums'

export interface PartyAffiliationSourceReportData {
  report_slug: string
  sitting_date: string
}

export interface PartyAffiliationData {
  party: string
  started_on: string
  started_on_precision: DatePrecision
  is_started_on_upper_bound: boolean
  event: string
  source_url: string | null
  source_report: PartyAffiliationSourceReportData | null
}

export interface PartyNote {
  number: number
  label: string
  partyAffiliations: PartyAffiliationData[]
}
