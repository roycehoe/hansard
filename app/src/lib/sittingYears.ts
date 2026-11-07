import type { SittingData } from '@/api/sittings/getAllSittings'
import { parseISO } from 'date-fns'

export interface SittingRun {
  sessionNumber: number | null
  volumeNumber: number
  sittings: SittingData[]
}

export interface SittingYear {
  year: number
  runs: SittingRun[]
}

export function groupSittingsByYear(sittings: SittingData[]): SittingYear[] {
  const sittingYears: SittingYear[] = []
  for (const sitting of sittings) {
    const year = parseISO(sitting.sitting_date).getFullYear()
    let sittingYear = sittingYears[sittingYears.length - 1]
    if (sittingYear?.year !== year) {
      sittingYear = { year, runs: [] }
      sittingYears.push(sittingYear)
    }
    const lastRun = sittingYear.runs[sittingYear.runs.length - 1]
    const isSameRun =
      lastRun !== undefined &&
      lastRun.sessionNumber === sitting.session_number &&
      lastRun.volumeNumber === sitting.volume_number
    if (isSameRun) {
      lastRun.sittings.push(sitting)
    } else {
      sittingYear.runs.push({
        sessionNumber: sitting.session_number,
        volumeNumber: sitting.volume_number,
        sittings: [sitting],
      })
    }
  }
  return sittingYears
}

export function formatSittingRunLabel(run: SittingRun): string {
  if (run.sessionNumber === null) return `Volume ${run.volumeNumber}`
  return `Session ${run.sessionNumber}, Volume ${run.volumeNumber}`
}

export function pickActiveYear(
  years: number[],
  visibleYears: number[],
  hash: string
): number {
  const linkedYear = years.find((year) => String(year) === hash)
  if (linkedYear !== undefined && visibleYears.includes(linkedYear)) {
    return linkedYear
  }
  return years.find((year) => visibleYears.includes(year)) ?? years[0]
}
