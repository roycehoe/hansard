import type { ActEntryData, GetActResponse } from '@/api/acts/getAct'
import type {
  ReportBillActData,
  ReportBillData,
  ReportBillReportData,
} from '@/api/reports/getReport'
import { NUMBER_LOCALE } from '@/constants/constants'
import { getReportLabels, normaliseLawName } from '@/lib/actTimeline'

export interface TimelineReading {
  reportSlug: string
  sittingDate: string
  label: string
}

const BILL_TITLE_BRACKETS_PATTERN = /\([^)]*\)/g
const BILL_TITLE_AMENDING_BRACKETS_PATTERN =
  /\((?:amendment[^)]*|no\.?\s*\d+)\)/gi
const BILL_WORD_PATTERN = /\bbill\b/gi
const ACT_WORD = 'act'

function getBillLawName(billTitle: string, bracketsPattern: RegExp): string {
  return normaliseLawName(
    billTitle.replace(bracketsPattern, '').replace(BILL_WORD_PATTERN, ACT_WORD)
  )
}

function findNamedAct(
  acts: ReportBillActData[],
  billTitle: string
): ReportBillActData | undefined {
  for (const bracketsPattern of [
    BILL_TITLE_AMENDING_BRACKETS_PATTERN,
    BILL_TITLE_BRACKETS_PATTERN,
  ]) {
    const billLawName = getBillLawName(billTitle, bracketsPattern)
    const namedAct = acts.find(
      (act) => normaliseLawName(act.title) === billLawName
    )
    if (namedAct !== undefined) return namedAct
  }
  return undefined
}

// NOTE: the Timeline follows one Act: the Act the Bill made, else the Act its title names, else its only Act. A Bill that changed several Acts and names none follows none, since any one of them would be an arbitrary pick. The title is read first without its amending brackets, so the Land Titles (Strata) (Amendment) Bill names the Land Titles (Strata) Act, then without any brackets, so the Merchant Shipping (Miscellaneous Amendments) Bill names the Merchant Shipping Act.
export function findTimelineAct(
  bill: ReportBillData
): ReportBillActData | null {
  const madeActs = bill.acts.filter((act) => act.is_made_by_bill)
  return (
    findNamedAct(madeActs, bill.title) ??
    madeActs[0] ??
    findNamedAct(bill.acts, bill.title) ??
    (bill.acts.length === 1 ? bill.acts[0] : null)
  )
}

export function isTimelineShown(bill: ReportBillData): boolean {
  return bill.acts.length > 0 || bill.reports.length > 1
}

export function getBillTimelineReadings(
  reports: ReportBillReportData[]
): TimelineReading[] {
  const reportsOldestFirst = [...reports].sort((a, b) =>
    a.sitting_date.localeCompare(b.sitting_date)
  )
  const labels = getReportLabels(reportsOldestFirst)
  return reportsOldestFirst.map((report, index) => ({
    reportSlug: report.report_slug,
    sittingDate: report.sitting_date,
    label: labels[index],
  }))
}

// NOTE: every Act the Bill changed bar the one the rail ends with, by title. With no such Act, every Act.
export function getTimelineOtherActs(
  bill: ReportBillData,
  leadAct: ReportBillActData | null
): ReportBillActData[] {
  return bill.acts
    .filter((act) => act.sso_code !== leadAct?.sso_code)
    .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
}

export function formatChangedActCount(actCount: number): string {
  return `Changed ${actCount.toLocaleString(NUMBER_LOCALE)} ${actCount === 1 ? 'Act' : 'Acts'}`
}

// NOTE: the Act's entry for this Bill is its first entry whose Bill has a reading on this Bill's reports, so the rail can print the date the record gives it in force.
export function findBillEntry(
  act: GetActResponse,
  bill: ReportBillData
): ActEntryData | null {
  const reportSlugs = new Set(bill.reports.map((report) => report.report_slug))
  return (
    [...act.entries]
      .sort((a, b) => a.ordinal - b.ordinal)
      .find((entry) =>
        entry.bill?.reports.some((report) =>
          reportSlugs.has(report.report_slug)
        )
      ) ?? null
  )
}
