import type {
  ActHistoryEntryKind,
  BillLinkSource,
} from '@/constants/bills/enums'

export interface ActEntryBillData {
  bill_key: string
  title: string
  first_sitting_date: string
  last_sitting_date: string
  is_passed: boolean
  act_count: number
}

export interface ActEntryData {
  ordinal: number
  kind: ActHistoryEntryKind
  printed_title: string
  printed_law_number: string
  printed_bill_number: string | null
  first_reading_date: string | null
  second_reading_date: string | null
  third_reading_date: string | null
  commencement_date: string | null
  bill_link_source: BillLinkSource | null
  bill: ActEntryBillData | null
}

export interface GetActResponse {
  sso_code: string
  title: string
  entries: ActEntryData[]
}
