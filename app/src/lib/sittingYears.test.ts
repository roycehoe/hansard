import type { SittingData } from '@/api/sittings/getAllSittings'
import {
  formatSittingRunLabel,
  groupSittingsByYear,
  pickActiveYear,
} from '@/lib/sittingYears'
import { describe, expect, it } from 'vitest'

function buildSitting(
  sittingDate: string,
  sessionNumber: number | null,
  volumeNumber: number,
  sittingNumber: number | null = 1
): SittingData {
  return {
    sitting_date: sittingDate,
    parliament_number: 0,
    volume_number: volumeNumber,
    sitting_number: sittingNumber,
    session_number: sessionNumber,
    report_count: 3,
  }
}

function summariseYears(sittings: SittingData[]) {
  return groupSittingsByYear(sittings).map((sittingYear) => ({
    year: sittingYear.year,
    runs: sittingYear.runs.map((run) => ({
      label: formatSittingRunLabel(run),
      rowCount: run.sittings.length,
    })),
  }))
}

describe('groupSittingsByYear', () => {
  it('opens a run in each year when a run crosses a year', () => {
    expect(
      summariseYears([
        buildSitting('1955-11-25', 1, 1),
        buildSitting('1956-02-08', 1, 1),
      ])
    ).toEqual([
      { year: 1955, runs: [{ label: 'Session 1, Volume 1', rowCount: 1 }] },
      { year: 1956, runs: [{ label: 'Session 1, Volume 1', rowCount: 1 }] },
    ])
  })

  it('does not merge the three Session 1 runs', () => {
    const labels = summariseYears([
      buildSitting('1956-06-07', 1, 1),
      buildSitting('1959-07-01', 1, 11),
      buildSitting('1963-10-22', 1, 22),
    ]).map((sittingYear) => sittingYear.runs[0].label)
    expect(labels).toEqual([
      'Session 1, Volume 1',
      'Session 1, Volume 11',
      'Session 1, Volume 22',
    ])
  })

  it('starts a new run when the session restarts in a year', () => {
    expect(
      summariseYears([
        buildSitting('1959-03-19', 3, 9),
        buildSitting('1959-07-01', 1, 11),
      ])
    ).toEqual([
      {
        year: 1959,
        runs: [
          { label: 'Session 3, Volume 9', rowCount: 1 },
          { label: 'Session 1, Volume 11', rowCount: 1 },
        ],
      },
    ])
  })

  it('starts a new run when the volume changes in a session', () => {
    const [sittingYear] = groupSittingsByYear([
      buildSitting('1957-07-30', 2, 3),
      buildSitting('1957-08-21', 2, 4),
    ])
    expect(sittingYear.runs).toHaveLength(2)
  })

  it('labels the null session by its volume alone', () => {
    expect(
      summariseYears([
        buildSitting('1986-03-17', 2, 47),
        buildSitting('1986-03-18', null, 47),
        buildSitting('1986-03-19', 2, 47),
        buildSitting('1986-03-20', 2, 47),
      ])
    ).toEqual([
      {
        year: 1986,
        runs: [
          { label: 'Session 2, Volume 47', rowCount: 1 },
          { label: 'Volume 47', rowCount: 1 },
          { label: 'Session 2, Volume 47', rowCount: 2 },
        ],
      },
    ])
  })

  it('keeps a one-sitting year', () => {
    expect(summariseYears([buildSitting('1965-06-16', 1, 23)])).toEqual([
      { year: 1965, runs: [{ label: 'Session 1, Volume 23', rowCount: 1 }] },
    ])
  })

  it('splits Parliament 15 into two years with one label each', () => {
    expect(
      summariseYears([
        buildSitting('2025-11-06', 1, 96),
        buildSitting('2026-01-12', 1, 96),
        buildSitting('2026-10-07', 1, 96),
      ])
    ).toEqual([
      { year: 2025, runs: [{ label: 'Session 1, Volume 96', rowCount: 1 }] },
      { year: 2026, runs: [{ label: 'Session 1, Volume 96', rowCount: 2 }] },
    ])
  })

  it('keeps a row with a blank sitting number', () => {
    const [sittingYear] = groupSittingsByYear([
      buildSitting('2026-01-12', 1, 96, null),
    ])
    expect(sittingYear.runs[0].sittings).toHaveLength(1)
  })

  it('returns nothing for no rows', () => {
    expect(groupSittingsByYear([])).toEqual([])
  })

  it('keeps the order it was given', () => {
    const sittings = [
      buildSitting('1959-03-19', 3, 9),
      buildSitting('1959-07-01', 1, 11),
      buildSitting('1960-01-05', 1, 11),
    ]
    const flattened = groupSittingsByYear(sittings).flatMap((sittingYear) =>
      sittingYear.runs.flatMap((run) => run.sittings)
    )
    expect(flattened).toEqual(sittings)
  })
})

describe('pickActiveYear', () => {
  it('returns the linked year while it is on screen', () => {
    expect(pickActiveYear([1964, 1965], [1964, 1965], '1965')).toBe(1965)
  })

  it('returns the first visible year for an empty hash', () => {
    expect(pickActiveYear([1964, 1965], [1964, 1965], '')).toBe(1964)
  })

  it('ignores a hash that is not one of the years', () => {
    expect(pickActiveYear([1964, 1965], [1964, 1965], '2026')).toBe(1964)
  })

  it('returns the visible year when the linked year is off screen', () => {
    expect(pickActiveYear([1961, 1962, 1963], [1963], '1961')).toBe(1963)
  })

  it('returns the first year when nothing is visible', () => {
    expect(pickActiveYear([1961, 1962], [], '')).toBe(1961)
  })
})
