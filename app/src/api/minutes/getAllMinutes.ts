import type {
  MinutesFileFormat,
  MinutesStatus,
} from '@/constants/minutes/enums'

export interface MinutesData {
  sitting_date: string
  status: MinutesStatus
  printed_label: string | null
  printed_parliament: string | null
  file_url: string | null
  archive_timestamp: string | null
  file_format: MinutesFileFormat | null
}

export interface GetAllMinutesResponse {
  minutes: MinutesData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
}
