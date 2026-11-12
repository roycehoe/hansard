export type AttachedFileKind = 'ANNEX' | 'VERNACULAR'

export interface AttachedFileData {
  kind: AttachedFileKind
  printed_title: string
  file_name: string
  section_type: string | null
}

export interface AttachedFilePointerData {
  ordinal: number
  printed_text: string
  url: string | null
  speech_ordinal: number | null
  file: AttachedFileData | null
}

export interface GetReportAttachedFilesResponse {
  pointers: AttachedFilePointerData[]
}
