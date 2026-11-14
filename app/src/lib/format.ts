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
const NAME_LIST_SEPARATOR = ', '
const NAME_LIST_LAST_SEPARATOR = ' and '
const MEMBERSHIP_LIST_SEPARATOR = ', '

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

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

export function formatParliamentRange(parliamentNumbers: number[]): string {
  const first = formatParliament(Math.min(...parliamentNumbers))
  const last = formatParliament(Math.max(...parliamentNumbers))
  return first === last ? first : `${first} to ${last}`
}

export function formatMembershipParliaments(
  memberships: MembershipData[]
): string {
  return formatParliamentRange(
    memberships.map((membership) => membership.parliament_number)
  )
}

function groupParliamentRuns(parliamentNumbers: number[]): number[][] {
  const runs: number[][] = []
  for (const parliamentNumber of [...new Set(parliamentNumbers)].sort(
    (a, b) => a - b
  )) {
    const lastRun = runs[runs.length - 1]
    if (lastRun?.[lastRun.length - 1] === parliamentNumber - 1) {
      lastRun.push(parliamentNumber)
    } else {
      runs.push([parliamentNumber])
    }
  }
  return runs
}

function isNumberRange(run: number[]): boolean {
  return run.length > 1 && run[0] !== LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
}

function formatParliamentRun(
  run: number[],
  isAfterNumberRange: boolean
): string {
  const first = run[0]
  const last = run[run.length - 1]
  if (first === last) return formatParliament(first)
  if (first === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER) {
    return `${LEGISLATIVE_ASSEMBLY_LABEL} to ${formatParliament(last)}`
  }
  return isAfterNumberRange
    ? `${first} to ${last}`
    : `Parliaments ${first} to ${last}`
}

export function formatParliamentRuns(parliamentNumbers: number[]): string {
  return groupParliamentRuns(parliamentNumbers)
    .map((run, index, runs) =>
      formatParliamentRun(run, index > 0 && isNumberRange(runs[index - 1]))
    )
    .join(MEMBERSHIP_LIST_SEPARATOR)
}

export function formatMembershipSeats(membership: {
  party: string
  constituencies: string[]
}): string {
  return membership.constituencies
    .filter((constituency) => !membership.party.includes(constituency))
    .join(MEMBERSHIP_LIST_SEPARATOR)
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

export function getNameListSeparator(index: number, count: number): string {
  if (index === 0) return ''
  return index === count - 1 ? NAME_LIST_LAST_SEPARATOR : NAME_LIST_SEPARATOR
}
