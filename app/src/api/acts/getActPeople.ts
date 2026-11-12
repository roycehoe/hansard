export interface ActPersonBillData {
  bill_key: string
  title: string
  act_count: number
  printed_speakers: string[]
  reading_speech_count: number
  budget_debate_speech_count: number
}

export interface ActPersonData {
  person_id: number
  person_slug: string
  canonical_name: string
  bill_count: number
  bills: ActPersonBillData[]
}

export interface GetActPeopleResponse {
  people: ActPersonData[]
  page: number
  page_size: number
  has_next_page: boolean
  total_count: number
}
