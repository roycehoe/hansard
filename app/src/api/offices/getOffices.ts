import type {
  AttendanceOfficeSource,
  OfficeClass,
  OfficeTitleMinistrySource,
} from '@/constants/offices/enums'

export interface MinistrySummaryData {
  id: number
  name: string
  title_count: number
  put_to_report_count: number
  answered_by_report_count: number
}

export interface GetAllMinistriesResponse {
  ministries: MinistrySummaryData[]
}

export interface MinistryTitleData {
  office_printed: string
  source: OfficeTitleMinistrySource
}

export interface MinistrySeeAlsoData {
  ministry_id: number
  name: string
  note: string
  source_url: string
}

export interface GetMinistryResponse {
  id: number
  name: string
  titles: MinistryTitleData[]
  see_also: MinistrySeeAlsoData[]
}

export interface MinistryReferenceData {
  id: number
  name: string
}

export interface PutToData {
  ordinal: number
  office_printed: string
  printed_text: string
  ministries: MinistryReferenceData[]
}

export interface AnsweredByData {
  ordinal: number
  printed_name: string
  membership_id: number | null
  office_printed: string
  office_class: OfficeClass | null
  answering_for_printed: string
  ministries: MinistryReferenceData[]
}

export interface MinistryQuestionData {
  report_slug: string
  title: string
  sitting_date: string
  report_type: string
  put_to: PutToData[]
  answered_by: AnsweredByData[]
}

export interface GetMinistryQuestionsResponse {
  total_count: number
  questions: MinistryQuestionData[]
}

export interface PrintEvidenceData {
  sitting_date: string
  entry_line_printed: string
  source: AttendanceOfficeSource
  extracted_at: string
}

export interface PrintedRangeData {
  office_printed: string
  office_class: OfficeClass
  sitting_count: number
  first_print: PrintEvidenceData
  last_print: PrintEvidenceData
}

export interface GetMembershipPrintedRangesResponse {
  membership_id: number
  ranges: PrintedRangeData[]
}

export interface GetReportOfficesResponse {
  put_to: PutToData[]
  answered_by: AnsweredByData[]
}
