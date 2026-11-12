import type { AttachedFileKind } from '@/api/reports/getReportAttachedFiles'

export interface SittingAttachedFilePointerData {
  report_slug: string
  report_title: string
  ordinal: number
  printed_text: string
  url: string | null
  speech_ordinal: number | null
}

export interface SittingAttachedFileData {
  kind: AttachedFileKind
  printed_title: string
  file_name: string
  section_type: string | null
  url: string | null
  pointers: SittingAttachedFilePointerData[]
}

export interface GetSittingAttachedFilesResponse {
  files: SittingAttachedFileData[]
  unlisted_pointers: SittingAttachedFilePointerData[]
}
