import type { ActEntryData, ActEntryReportData } from '@/api/acts/getAct'
import { ACT_EVENT_KIND_SEPARATOR } from '@/constants/acts/constants'
import { ActEventKind } from '@/constants/acts/enums'
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

const ACT_EVENT_KINDS = new Set<string>(Object.values(ActEventKind))

export type ActEvent =
  | {
      kind: ActEventKind.READING
      entry: ActEntryData
      report: ActEntryReportData
      label: string
      isNewestReading: boolean
    }
  | { kind: ActEventKind.LEGISLATION; entry: ActEntryData }

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

function isActEventKind(value: string): value is ActEventKind {
  return ACT_EVENT_KINDS.has(value)
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

function getEntryEventsOldestFirst(entry: ActEntryData): ActEvent[] {
  const reports = sortReportsOldestFirst(getReports(entry))
  const labels = getReportLabels(reports)
  const readings = reports.map((report, index): ActEvent => ({
    kind: ActEventKind.READING,
    entry,
    report,
    label: labels[index],
    isNewestReading: index === reports.length - 1,
  }))
  return [...readings, { kind: ActEventKind.LEGISLATION, entry }]
}

// NOTE: every reading and every entry is one event, newest first by its own date, so a backdated In force falls below its readings. An entry the record gives no date sits just above the entry before it in the record. On one date, a later entry comes first, and an entry's own event comes above its readings.
export function getActEventsNewestFirst(entries: ActEntryData[]): ActEvent[] {
  let previousEntryDate = ''
  const datedEvents = [...entries]
    .sort((a, b) => a.ordinal - b.ordinal)
    .flatMap((entry) => {
      const entryDate = entry.commencement_date ?? previousEntryDate
      previousEntryDate = entryDate
      return getEntryEventsOldestFirst(entry).map((event) => ({
        event,
        date:
          event.kind === ActEventKind.READING
            ? event.report.sitting_date
            : entryDate,
      }))
    })
  return datedEvents
    .map((datedEvent, recordIndex) => ({ ...datedEvent, recordIndex }))
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.recordIndex - a.recordIndex
    )
    .map(({ event }) => event)
}

export function countActEventsByKind(
  events: ActEvent[]
): Record<ActEventKind, number> {
  const counts = {
    [ActEventKind.READING]: 0,
    [ActEventKind.LEGISLATION]: 0,
  }
  for (const event of events) counts[event.kind] += 1
  return counts
}

export function getAvailableActEventKinds(
  counts: Record<ActEventKind, number>
): ActEventKind[] {
  return Object.values(ActEventKind).filter((kind) => counts[kind] > 0)
}

export function parseShownActEventKinds(
  kindParam: string | undefined,
  availableKinds: ActEventKind[]
): ActEventKind[] {
  if (kindParam === undefined) return availableKinds
  const namedKinds = new Set(
    kindParam.split(ACT_EVENT_KIND_SEPARATOR).filter(isActEventKind)
  )
  return availableKinds.filter((kind) => namedKinds.has(kind))
}

export function formatShownActEventKinds(
  shownKinds: ActEventKind[],
  availableKinds: ActEventKind[]
): string | undefined {
  return shownKinds.length === availableKinds.length
    ? undefined
    : shownKinds.join(ACT_EVENT_KIND_SEPARATOR)
}

// NOTE: the Original is the earliest law that carries the Act's own name, once the year, punctuation and "Ordinance" for "Act" are set aside. The record's first entry is often an older law folded in later, or an amending Act, so it is not used.
export function findOriginalEntryOrdinal(
  actTitle: string,
  entries: ActEntryData[]
): number | null {
  const actName = normaliseLawName(actTitle)
  const namedEntries = getActEventsNewestFirst(entries)
    .filter((event) => event.kind === ActEventKind.LEGISLATION)
    .map((event) => event.entry)
    .filter(
      (entry) =>
        ORIGINAL_KINDS.has(entry.kind) &&
        normaliseLawName(entry.printed_title) === actName
    )
  return namedEntries[namedEntries.length - 1]?.ordinal ?? null
}

export function formatOtherActCount(actCount: number): string | null {
  const otherActCount = actCount - 1
  if (otherActCount < 1) return null
  return `Also changed ${otherActCount.toLocaleString(NUMBER_LOCALE)} other ${otherActCount === 1 ? 'Act' : 'Acts'}`
}
