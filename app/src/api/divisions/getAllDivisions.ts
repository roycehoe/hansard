import type {
  DivisionCountSource,
  DivisionListStatus,
} from '@/constants/divisions/enums'

export interface DivisionData {
  id: number
  sitting_date: string
  parliament_number: number
  report_slug: string | null
  report_title: string | null
  speech_ordinal: number | null
  count_source: DivisionCountSource
  printed_counts: string
  ayes: number | null
  noes: number | null
  abstentions: number | null
  absent: number | null
  paired: number | null
  list_status: DivisionListStatus
}

export interface GetAllDivisionsResponse {
  divisions: DivisionData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
}
