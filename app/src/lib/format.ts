import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import type { MembershipData } from '@/api/people/getAllPersons'
import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'
import { DatePrecision } from '@/constants/people/enums'
import type { PartyAffiliationData } from '@/types/people/interfaces'
import { format, parseISO } from 'date-fns'

const SITTING_DATE_FORMAT = 'd MMMM yyyy'
const SITTING_DAY_MONTH_FORMAT = 'd MMMM'
const MONTH_YEAR_FORMAT = 'MMMM yyyy'
const WWW_PREFIX = /^www\./

export function formatSittingDate(sittingDate: string): string {
  return format(parseISO(sittingDate), SITTING_DATE_FORMAT)
}

export function formatCalendarDate(date: Date): string {
  return format(date, SITTING_DATE_FORMAT)
}

export function formatSittingDayMonth(sittingDate: string): string {
  return format(parseISO(sittingDate), SITTING_DAY_MONTH_FORMAT)
}

export function formatParliament(parliamentNumber: number): string {
  return parliamentNumber === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
    ? LEGISLATIVE_ASSEMBLY_LABEL
    : `Parliament ${parliamentNumber}`
}

export function formatParliamentOption(parliament: ParliamentData): string {
  const firstYear = parseISO(parliament.first_sitting_date).getFullYear()
  const lastYear = parseISO(parliament.last_sitting_date).getFullYear()
  const years =
    firstYear === lastYear ? firstYear : `${firstYear} to ${lastYear}`
  return `${formatParliament(parliament.parliament_number)} (${years})`
}

export function formatMembershipParliaments(
  memberships: MembershipData[]
): string {
  const parliamentNumbers = memberships.map(
    (membership) => membership.parliament_number
  )
  const first = formatParliament(Math.min(...parliamentNumbers))
  const last = formatParliament(Math.max(...parliamentNumbers))
  return first === last ? first : `${first} to ${last}`
}

export function getMembershipParties(memberships: MembershipData[]): string[] {
  return [
    ...new Set(
      memberships
        .map((membership) => membership.party)
        .filter((party) => party !== '')
    ),
  ]
}

export function formatMembershipSummary(memberships: MembershipData[]): string {
  if (memberships.length === 0) return ''
  return [
    formatMembershipParliaments(memberships),
    ...getMembershipParties(memberships),
  ].join(', ')
}

export function formatPartyAffiliationStart(
  partyAffiliation: PartyAffiliationData
): string {
  const startedOn =
    partyAffiliation.started_on_precision === DatePrecision.DAY
      ? formatSittingDate(partyAffiliation.started_on)
      : format(parseISO(partyAffiliation.started_on), MONTH_YEAR_FORMAT)
  return partyAffiliation.is_started_on_upper_bound
    ? `By ${startedOn}`
    : startedOn
}

export function formatSourceUrlHost(sourceUrl: string): string {
  return new URL(sourceUrl).hostname.replace(WWW_PREFIX, '')
}
