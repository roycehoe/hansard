import type { ActEntryData, ActEntryReportData } from '@/api/acts/getAct'
import { ActEntryRowKind } from '@/constants/acts/enums'
import {
  DEBATE_LABEL,
  FIRST_READING_LABEL,
  SECOND_READING_CONTINUED_LABEL,
  SECOND_READING_LABEL,
  THIRD_READING_LABEL,
} from '@/constants/bills/constants'
import { ActHistoryEntryKind, BillStage } from '@/constants/bills/enums'
import { NUMBER_LOCALE } from '@/constants/constants'

const CHAPTER_PATTERN = /\(chapter [^)]*\)/gi
const PUNCTUATION_PATTERN = /[,.]/g
const WHITESPACE_PATTERN = /\s+/g
const TRAILING_YEAR_PATTERN = /\s+(of\s+)?\d{4}$/i
const LEADING_THE_PATTERN = /^the\s+/i
const ORDINANCE_PATTERN = /\bordinance\b/gi

const ORIGINAL_KINDS = new Set<ActHistoryEntryKind>([
  ActHistoryEntryKind.ACT,
  ActHistoryEntryKind.ORDINANCE,
  ActHistoryEntryKind.OTHER,
])

const ONE_LINE_KINDS = new Set<ActHistoryEntryKind>([
  ActHistoryEntryKind.REVISED_EDITION,
  ActHistoryEntryKind.SUBSIDIARY_LEGISLATION,
])

export type ActEntryRow =
  | { kind: ActEntryRowKind.REPORT; report: ActEntryReportData; label: string }
  | { kind: ActEntryRowKind.IN_FORCE; date: string; isBackdated: boolean }

function getReports(entry: ActEntryData): ActEntryReportData[] {
  return entry.bill?.reports ?? []
}

function sortReportsOldestFirst(
  reports: ActEntryReportData[]
): ActEntryReportData[] {
  return [...reports].sort((a, b) =>
    a.sitting_date.localeCompare(b.sitting_date)
  )
}

function getFirstReportDate(entry: ActEntryData): string | null {
  return sortReportsOldestFirst(getReports(entry))[0]?.sitting_date ?? null
}

function normaliseLawName(title: string): string {
  return title
    .replace(CHAPTER_PATTERN, '')
    .replace(PUNCTUATION_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim()
    .replace(TRAILING_YEAR_PATTERN, '')
    .replace(LEADING_THE_PATTERN, '')
    .replace(ORDINANCE_PATTERN, 'act')
    .toLowerCase()
}

// NOTE: one label per report, worked out in date order. A report the record names no reading for reads "Debate", or "Second reading continued" once a second reading has opened and not yet been agreed.
export function getReportLabels(reports: ActEntryReportData[]): string[] {
  let isSecondReadingOpen = false
  let isSecondReadingAgreed = false
  return reports.map((report) => {
    const stages = new Set(report.stages)
    const isContinued = isSecondReadingOpen && !isSecondReadingAgreed
    const labels: string[] = []
    if (stages.has(BillStage.FIRST_READING)) labels.push(FIRST_READING_LABEL)
    if (stages.has(BillStage.SECOND_READING_ORDER)) {
      labels.push(SECOND_READING_LABEL)
    } else if (stages.has(BillStage.SECOND_READING_AGREED)) {
      labels.push(
        isContinued ? SECOND_READING_CONTINUED_LABEL : SECOND_READING_LABEL
      )
    }
    if (stages.has(BillStage.THIRD_READING)) labels.push(THIRD_READING_LABEL)
    if (labels.length === 0) {
      labels.push(isContinued ? SECOND_READING_CONTINUED_LABEL : DEBATE_LABEL)
    }
    if (stages.has(BillStage.SECOND_READING_ORDER)) isSecondReadingOpen = true
    if (stages.has(BillStage.SECOND_READING_AGREED)) {
      isSecondReadingAgreed = true
    }
    return labels.join(', ')
  })
}

// NOTE: the record prints the In force date; "backdated" is our reading beside it, never in its place (ADR 0006).
export function isEntryBackdated(entry: ActEntryData): boolean {
  const firstReportDate = getFirstReportDate(entry)
  return (
    entry.commencement_date !== null &&
    firstReportDate !== null &&
    entry.commencement_date < firstReportDate
  )
}

export function isOneLineEntry(entry: ActEntryData): boolean {
  return ONE_LINE_KINDS.has(entry.kind)
}

// NOTE: newest first by each entry's first debate, or its In force date where no debate is on record. An entry with neither keeps its place after the entry before it in the record, and ties keep the record's order.
export function sortActEntriesNewestFirst(
  entries: ActEntryData[]
): ActEntryData[] {
  let previousDate = ''
  const datedEntries = [...entries]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((entry) => {
      const date =
        getFirstReportDate(entry) ?? entry.commencement_date ?? previousDate
      previousDate = date
      return { entry, date }
    })
  return datedEntries
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.entry.ordinal - a.entry.ordinal
    )
    .map(({ entry }) => entry)
}

// NOTE: the Original is the earliest law that carries the Act's own name, once the year, punctuation and "Ordinance" for "Act" are set aside. The record's first entry is often an older law folded in later, or an amending Act, so it is not used.
export function findOriginalEntryOrdinal(
  actTitle: string,
  entries: ActEntryData[]
): number | null {
  const actName = normaliseLawName(actTitle)
  const namedEntries = sortActEntriesNewestFirst(entries).filter(
    (entry) =>
      ORIGINAL_KINDS.has(entry.kind) &&
      normaliseLawName(entry.printed_title) === actName
  )
  return namedEntries[namedEntries.length - 1]?.ordinal ?? null
}

// NOTE: newest first, so In force leads and First reading closes. A backdated In force row falls below the readings, where its date puts it.
export function getActEntryRows(entry: ActEntryData): ActEntryRow[] {
  const reports = sortReportsOldestFirst(getReports(entry))
  const labels = getReportLabels(reports)
  const rows: ActEntryRow[] = reports
    .map((report, index): ActEntryRow => ({
      kind: ActEntryRowKind.REPORT,
      report,
      label: labels[index],
    }))
    .reverse()
  if (entry.commencement_date === null) return rows
  const inForceDate = entry.commencement_date
  const inForceIndex = rows.findIndex(
    (row) =>
      row.kind === ActEntryRowKind.REPORT &&
      row.report.sitting_date <= inForceDate
  )
  rows.splice(inForceIndex === -1 ? rows.length : inForceIndex, 0, {
    kind: ActEntryRowKind.IN_FORCE,
    date: inForceDate,
    isBackdated: isEntryBackdated(entry),
  })
  return rows
}

export function formatOtherActCount(actCount: number): string | null {
  const otherActCount = actCount - 1
  if (otherActCount < 1) return null
  return `Also changed ${otherActCount.toLocaleString(NUMBER_LOCALE)} other ${otherActCount === 1 ? 'Act' : 'Acts'}`
}
