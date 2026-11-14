import type { GetActResponse } from '@/api/acts/getAct'
import type {
  ReportBillActData,
  ReportBillData,
  ReportBillReportData,
} from '@/api/reports/getReport'
import { ActEventKind } from '@/constants/acts/enums'
import {
  formatOtherActCount,
  getActEventsNewestFirst,
  getReportLabels,
  normaliseLawName,
} from '@/lib/actTimeline'

export interface TimelineReading {
  reportSlug: string
  sittingDate: string
  label: string
  title: string | null
  otherActCount: string | null
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
  return findTimelineAct(bill) !== null || bill.reports.length > 1
}

export function getActTimelineReadings(act: GetActResponse): TimelineReading[] {
  const seenReportSlugs = new Set<string>()
  const readings: TimelineReading[] = []
  for (const event of getActEventsNewestFirst(act.entries)) {
    if (event.kind !== ActEventKind.READING) continue
    if (seenReportSlugs.has(event.report.report_slug)) continue
    seenReportSlugs.add(event.report.report_slug)
    readings.push({
      reportSlug: event.report.report_slug,
      sittingDate: event.report.sitting_date,
      label: event.label,
      title: event.report.title,
      otherActCount:
        event.isNewestReading && event.entry.bill !== null
          ? formatOtherActCount(event.entry.bill.act_count)
          : null,
    })
  }
  return readings
}

export function getBillTimelineReadings(
  reports: ReportBillReportData[]
): TimelineReading[] {
  const reportsOldestFirst = [...reports].sort((a, b) =>
    a.sitting_date.localeCompare(b.sitting_date)
  )
  const labels = getReportLabels(reportsOldestFirst)
  return reportsOldestFirst
    .map((report, index) => ({
      reportSlug: report.report_slug,
      sittingDate: report.sitting_date,
      label: labels[index],
      title: null,
      otherActCount: null,
    }))
    .reverse()
}
