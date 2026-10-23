import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import { DatePrecision } from '@/constants/people/enums'
import {
  formatCalendarDate,
  formatParliamentOption,
  formatPartyAffiliationStart,
  formatSittingDate,
  formatSittingDayMonth,
} from '@/lib/format'
import type { PartyAffiliationData } from '@/types/people/interfaces'
import { describe, expect, it } from 'vitest'

function buildParliament(
  firstSittingDate: string,
  lastSittingDate: string,
  parliamentNumber = 14
): ParliamentData {
  return {
    parliament_number: parliamentNumber,
    sitting_count: 0,
    report_count: 0,
    text_report_count: 0,
    first_sitting_date: firstSittingDate,
    last_sitting_date: lastSittingDate,
  }
}

function buildAffiliation(
  startedOn: string,
  precision: DatePrecision,
  isUpperBound: boolean
): PartyAffiliationData {
  return {
    party: 'PAP',
    started_on: startedOn,
    started_on_precision: precision,
    is_started_on_upper_bound: isUpperBound,
    event: '',
    source_url: null,
    source_report: null,
  }
}

describe('formatSittingDate', () => {
  it('writes day, full month name and year', () => {
    expect(formatSittingDate('2023-02-14')).toBe('14 February 2023')
  })

  it('drops the leading zero on the day', () => {
    expect(formatSittingDate('2023-02-04')).toBe('4 February 2023')
  })

  it('keeps the date on the first and last day of the year', () => {
    expect(formatSittingDate('2023-01-01')).toBe('1 January 2023')
    expect(formatSittingDate('2023-12-31')).toBe('31 December 2023')
  })

  it('handles a leap day', () => {
    expect(formatSittingDate('2024-02-29')).toBe('29 February 2024')
  })

  it('reads the date part of a full timestamp', () => {
    expect(formatSittingDate('2023-02-14T00:00:00')).toBe('14 February 2023')
  })
})

describe('formatCalendarDate', () => {
  it('formats a Date the way a sitting date is formatted', () => {
    expect(formatCalendarDate(new Date(2023, 1, 4))).toBe('4 February 2023')
  })
})

describe('formatSittingDayMonth', () => {
  it('writes day and month without the year', () => {
    expect(formatSittingDayMonth('2023-02-04')).toBe('4 February')
    expect(formatSittingDayMonth('2023-11-30')).toBe('30 November')
  })
})

describe('formatPartyAffiliationStart', () => {
  it('writes the full date when the precision is a day', () => {
    expect(
      formatPartyAffiliationStart(
        buildAffiliation('2020-03-05', DatePrecision.DAY, false)
      )
    ).toBe('5 March 2020')
  })

  it('writes month and year when the precision is a month', () => {
    expect(
      formatPartyAffiliationStart(
        buildAffiliation('2020-03-01', DatePrecision.MONTH, false)
      )
    ).toBe('March 2020')
  })

  it('puts By in front when the date is an upper bound', () => {
    expect(
      formatPartyAffiliationStart(
        buildAffiliation('2020-03-05', DatePrecision.DAY, true)
      )
    ).toBe('By 5 March 2020')
    expect(
      formatPartyAffiliationStart(
        buildAffiliation('2020-03-01', DatePrecision.MONTH, true)
      )
    ).toBe('By March 2020')
  })
})

describe('formatParliamentOption', () => {
  it('shows the first and last year of a Parliament', () => {
    expect(
      formatParliamentOption(buildParliament('2020-08-24', '2025-06-30'))
    ).toBe('Parliament 14 (2020 to 2025)')
  })

  it('shows one year when the first and last sittings share it', () => {
    expect(
      formatParliamentOption(buildParliament('2020-01-10', '2020-12-31'))
    ).toBe('Parliament 14 (2020)')
  })

  it('names the Legislative Assembly', () => {
    expect(
      formatParliamentOption(buildParliament('1955-04-22', '1959-05-30', 0))
    ).toBe('Legislative Assembly (1955 to 1959)')
  })
})
