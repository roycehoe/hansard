import type {
  DivisionCountSource,
  DivisionListStatus,
  DivisionVoteChoice,
  DivisionVoteListSource,
  MinutesDivisionPairing,
} from '@/constants/divisions/enums'

export interface DivisionVoteData {
  printed_name: string
  vote_choice: DivisionVoteChoice
  list_source: DivisionVoteListSource
  membership_id: number | null
  party: string | null
  is_party_uncertain: boolean
}

export interface DivisionPartyCountData {
  list_source: DivisionVoteListSource
  vote_choice: DivisionVoteChoice
  party: string | null
  member_count: number
  uncertain_member_count: number
}

export interface DivisionMinutesData {
  sitting_date: string
  printed_counts: string
  printed_label: string | null
  file_url: string | null
  pairing: MinutesDivisionPairing
  list_status: DivisionListStatus
  printed_list: string | null
}

export interface GetDivisionResponse {
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
  printed_list: string | null
  votes: DivisionVoteData[]
  party_counts: DivisionPartyCountData[]
  minutes: DivisionMinutesData | null
}
