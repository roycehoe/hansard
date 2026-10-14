import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import type { MembershipData } from '@/api/people/getAllPersons'
import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'
import { format, parseISO } from 'date-fns'

const SITTING_DATE_FORMAT = 'd MMMM yyyy'
const SITTING_DAY_MONTH_FORMAT = 'd MMMM'

export function formatSittingDate(sittingDate: string): string {
  return format(parseISO(sittingDate), SITTING_DATE_FORMAT)
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

export function formatMembershipSummary(memberships: MembershipData[]): string {
  if (memberships.length === 0) return ''
  const parliamentNumbers = memberships.map(
    (membership) => membership.parliament_number
  )
  const first = formatParliament(Math.min(...parliamentNumbers))
  const last = formatParliament(Math.max(...parliamentNumbers))
  const parliaments = first === last ? first : `${first} to ${last}`
  const parties = new Set(
    memberships
      .map((membership) => membership.party)
      .filter((party) => party !== '')
  )
  return [parliaments, ...parties].join(', ')
}
