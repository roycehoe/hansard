import type { PrintedRangeData } from '@/api/offices/getOffices'
import type {
  PersonBillData,
  PersonBillReportData,
} from '@/api/people/getPersonBills'
import type { PersonPrintedRangesMembershipData } from '@/api/people/getPersonPrintedRanges'
import { BillReportRole } from '@/constants/bills/enums'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatSittingDate } from '@/lib/format'

export interface MemberTimelineBill {
  bill: PersonBillData
  firstReport: PersonBillReportData
}

export interface MemberTimelineGroup {
  parliamentNumber: number
  printedRanges: PrintedRangeData[]
  bills: MemberTimelineBill[]
}

function compareByFirstPrint(
  first: PrintedRangeData,
  second: PrintedRangeData
): number {
  return first.first_print.sitting_date.localeCompare(
    second.first_print.sitting_date
  )
}

function compareByFirstReport(
  first: MemberTimelineBill,
  second: MemberTimelineBill
): number {
  return (
    first.firstReport.sitting_date.localeCompare(
      second.firstReport.sitting_date
    ) || first.bill.bill_key.localeCompare(second.bill.bill_key)
  )
}

export function buildMemberTimelineGroups(
  memberships: PersonPrintedRangesMembershipData[],
  bills: PersonBillData[]
): MemberTimelineGroup[] {
  const timelineBills = bills.map((bill) => ({
    bill,
    firstReport: bill.reports[0],
  }))
  const parliamentNumbers = new Set([
    ...memberships
      .filter((membership) => membership.ranges.length > 0)
      .map((membership) => membership.parliament_number),
    ...timelineBills.map(
      (timelineBill) => timelineBill.firstReport.parliament_number
    ),
  ])
  return [...parliamentNumbers]
    .sort((first, second) => first - second)
    .map((parliamentNumber) => ({
      parliamentNumber,
      printedRanges: memberships
        .filter(
          (membership) => membership.parliament_number === parliamentNumber
        )
        .flatMap((membership) => membership.ranges)
        .sort(compareByFirstPrint),
      bills: timelineBills
        .filter(
          (timelineBill) =>
            timelineBill.firstReport.parliament_number === parliamentNumber
        )
        .sort(compareByFirstReport),
    }))
}

export function getPrintedRangeSittingDates(range: PrintedRangeData): string[] {
  const firstSittingDate = range.first_print.sitting_date
  const lastSittingDate = range.last_print.sitting_date
  return firstSittingDate === lastSittingDate
    ? [firstSittingDate]
    : [firstSittingDate, lastSittingDate]
}

export function formatPrintedRangeSittingCount(sittingCount: number): string {
  return `${sittingCount.toLocaleString(NUMBER_LOCALE)} ${sittingCount === 1 ? 'sitting' : 'sittings'}`
}

export function formatPersonBillDates(reports: PersonBillReportData[]): string {
  const firstSittingDate = reports[0].sitting_date
  const lastSittingDate = reports[reports.length - 1].sitting_date
  return firstSittingDate === lastSittingDate
    ? formatSittingDate(firstSittingDate)
    : `${formatSittingDate(firstSittingDate)} to ${formatSittingDate(lastSittingDate)}`
}

export function formatPersonBillParagraphCount(bill: PersonBillData): string {
  const paragraphCount =
    bill.reading_speech_count + bill.budget_debate_speech_count
  return `${paragraphCount.toLocaleString(NUMBER_LOCALE)} ${paragraphCount === 1 ? 'paragraph' : 'paragraphs'}`
}

export function isEveryPersonBillReportBudgetDebate(
  bill: PersonBillData
): boolean {
  return bill.reports.every(
    (report) => report.role === BillReportRole.BUDGET_DEBATE
  )
}
