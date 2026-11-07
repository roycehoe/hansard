import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import { DatePrecision } from '@/constants/people/enums'
import {
  formatCalendarDate,
  formatMembershipSeats,
  formatParliamentOption,
  formatParliamentRuns,
  formatPartyAffiliationStart,
  formatSittingDate,
  formatSittingDayMonth,
  getNameListSeparator,
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

function joinNames(names: string[]): string {
  return names
    .map((name, index) => `${getNameListSeparator(index, names.length)}${name}`)
    .join('')
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

describe('getNameListSeparator', () => {
  it('writes one name alone', () => {
    expect(joinNames(['Lim'])).toBe('Lim')
  })

  it('puts and between two names', () => {
    expect(joinNames(['Lim', 'Tan'])).toBe('Lim and Tan')
  })

  it('puts commas between names and and before the last', () => {
    expect(joinNames(['Lim', 'Tan', 'Ong'])).toBe('Lim, Tan and Ong')
  })
})

describe('formatParliamentRuns', () => {
  it('names a single Parliament', () => {
    expect(formatParliamentRuns([15])).toBe('Parliament 15')
  })

  it('names the Legislative Assembly once however many rows it has', () => {
    expect(formatParliamentRuns([0])).toBe('Legislative Assembly')
    expect(formatParliamentRuns([0, 0])).toBe('Legislative Assembly')
  })

  it('writes a run of Parliaments as a range', () => {
    expect(formatParliamentRuns([6, 7, 8, 9, 10, 11, 12, 13, 14, 15])).toBe(
      'Parliaments 6 to 15'
    )
  })

  it('starts a range at the Legislative Assembly', () => {
    expect(formatParliamentRuns([0, 1, 2])).toBe(
      'Legislative Assembly to Parliament 2'
    )
  })

  it('drops the word after a range of numbers', () => {
    expect(formatParliamentRuns([4, 5, 6, 7, 8, 9, 10, 12, 13])).toBe(
      'Parliaments 4 to 10, 12 to 13'
    )
  })

  it('separates the Legislative Assembly from a later Parliament', () => {
    expect(formatParliamentRuns([0, 7])).toBe(
      'Legislative Assembly, Parliament 7'
    )
  })

  it('names a single Parliament after a range', () => {
    expect(formatParliamentRuns([5, 6, 9])).toBe(
      'Parliaments 5 to 6, Parliament 9'
    )
  })

  it('keeps the word after a single Parliament', () => {
    expect(formatParliamentRuns([12, 14, 15])).toBe(
      'Parliament 12, Parliaments 14 to 15'
    )
  })
})

describe('formatMembershipSeats', () => {
  it('drops a seat the party label already contains', () => {
    expect(
      formatMembershipSeats({
        party: 'Nominated Member of Parliament',
        constituencies: ['Nominated Member'],
      })
    ).toBe('')
  })

  it('writes nothing when there are no seats', () => {
    expect(
      formatMembershipSeats({ party: 'Non-partisan', constituencies: [] })
    ).toBe('')
  })

  it('keeps a seat the party label does not contain', () => {
    expect(
      formatMembershipSeats({
        party: 'Progress Singapore Party',
        constituencies: ['Non-Constituency Member'],
      })
    ).toBe('Non-Constituency Member')
  })

  it('joins two seats with a comma', () => {
    expect(
      formatMembershipSeats({
        party: "People's Action Party",
        constituencies: ['West Coast-Jurong', 'West Coast-Jurong West'],
      })
    ).toBe('West Coast-Jurong, West Coast-Jurong West')
  })
})
