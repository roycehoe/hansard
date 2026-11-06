import type {
  DatePrecision,
  PersonNameSpellingKind,
} from '@/constants/people/enums'

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

export interface PersonNameSpellingData {
  spelling: string
  kind: PersonNameSpellingKind
  note: string
}

export interface SpellingNoteSegment {
  text: string
  url?: string
}

export interface PartyNote {
  number: number
  label: string
  partyAffiliations: PartyAffiliationData[]
}

export interface HandAliasSource {
  label: string
  url: string
}

export interface HandAliasNote {
  sittingDate: string
  printedName: string
  sources: HandAliasSource[]
}
