import type {
  BillLinkSource,
  BillReportRole,
  BillStage,
} from '@/constants/bills/enums'
import type { ReportType } from '@/constants/reports/enums'

export interface BillStageLineData {
  stage: BillStage
  printed_text: string
  ordinal: number
}

export interface BillReportData {
  report_slug: string
  title: string
  report_type: ReportType
  sitting_date: string
  role: BillReportRole
  stage_lines: BillStageLineData[]
}

export interface BillActData {
  sso_code: string
  title: string
  printed_title: string
  printed_law_number: string
  bill_link_source: BillLinkSource | null
}

export interface BillPersonData {
  person_id: number
  person_slug: string
  canonical_name: string
  printed_speakers: string[]
  reading_speech_count: number
  budget_debate_speech_count: number
}

export interface GetBillResponse {
  bill_key: string
  title: string
  first_sitting_date: string
  last_sitting_date: string
  is_passed: boolean
  act_count: number
  reports: BillReportData[]
  acts: BillActData[]
  people: BillPersonData[]
}
