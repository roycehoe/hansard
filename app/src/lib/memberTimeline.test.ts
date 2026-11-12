import type { PrintedRangeData } from '@/api/offices/getOffices'
import type {
  PersonBillData,
  PersonBillReportData,
} from '@/api/people/getPersonBills'
import type { PersonPrintedRangesMembershipData } from '@/api/people/getPersonPrintedRanges'
import { BillReportRole } from '@/constants/bills/enums'
import { AttendanceOfficeSource, OfficeClass } from '@/constants/offices/enums'
import {
  buildMemberTimelineGroups,
  formatPersonBillDates,
  formatPersonBillParagraphCount,
  formatPrintedRangeSittingCount,
  getPrintedRangeSittingDates,
  isEveryPersonBillReportBudgetDebate,
} from '@/lib/memberTimeline'
import { describe, expect, it } from 'vitest'

function buildPrintedRange(
  officePrinted: string,
  firstSittingDate: string,
  lastSittingDate: string,
  sittingCount: number
): PrintedRangeData {
  return {
    office_printed: officePrinted,
    office_class: OfficeClass.MINISTER,
    sitting_count: sittingCount,
    first_print: {
      sitting_date: firstSittingDate,
      entry_line_printed: officePrinted,
      source: AttendanceOfficeSource.AFTER_CONSTITUENCY_BRACKET,
      extracted_at: '2026-11-01T00:00:00',
    },
    last_print: {
      sitting_date: lastSittingDate,
      entry_line_printed: officePrinted,
      source: AttendanceOfficeSource.AFTER_CONSTITUENCY_BRACKET,
      extracted_at: '2026-11-01T00:00:00',
    },
  }
}

function buildMembership(
  parliamentNumber: number,
  ranges: PrintedRangeData[]
): PersonPrintedRangesMembershipData {
  return {
    membership_id: parliamentNumber + 1000,
    parliament_number: parliamentNumber,
    ranges,
  }
}

function buildBillReport(
  reportSlug: string,
  sittingDate: string,
  parliamentNumber: number,
  role = BillReportRole.READING
): PersonBillReportData {
  return {
    report_slug: reportSlug,
    sitting_date: sittingDate,
    parliament_number: parliamentNumber,
    role,
  }
}

function buildBill(
  billKey: string,
  reports: PersonBillReportData[],
  readingSpeechCount = 1,
  budgetDebateSpeechCount = 0
): PersonBillData {
  return {
    bill_key: billKey,
    title: `${billKey} Bill`,
    first_sitting_date: reports[0].sitting_date,
    last_sitting_date: reports[reports.length - 1].sitting_date,
    is_passed: true,
    act_count: 0,
    printed_speakers: [],
    reading_speech_count: readingSpeechCount,
    budget_debate_speech_count: budgetDebateSpeechCount,
    reading_report_count: 0,
    budget_debate_report_count: 0,
    reports,
  }
}

const DEPUTY_PRIME_MINISTER_RANGE = buildPrintedRange(
  'Deputy Prime Minister and Minister for Finance',
  '2002-03-25',
  '2004-07-20',
  80
)

const PRIME_MINISTER_RANGE = buildPrintedRange(
  'Prime Minister and Minister for Finance',
  '2004-09-01',
  '2006-02-17',
  45
)

const ONE_SITTING_RANGE = buildPrintedRange(
  'PrimeMinister and Minister for Finance',
  '2006-02-27',
  '2006-02-27',
  1
)

describe('buildMemberTimelineGroups', () => {
  it("puts Lee Hsien Loong's Parliament 10 ranges in first-print order", () => {
    const groups = buildMemberTimelineGroups(
      [
        buildMembership(10, [
          PRIME_MINISTER_RANGE,
          DEPUTY_PRIME_MINISTER_RANGE,
        ]),
      ],
      []
    )

    expect(groups).toEqual([
      {
        parliamentNumber: 10,
        printedRanges: [DEPUTY_PRIME_MINISTER_RANGE, PRIME_MINISTER_RANGE],
        bills: [],
      },
    ])
  })

  it('runs the Parliaments oldest first and leaves out one with neither part', () => {
    const groups = buildMemberTimelineGroups(
      [
        buildMembership(11, [ONE_SITTING_RANGE]),
        buildMembership(9, []),
        buildMembership(10, [DEPUTY_PRIME_MINISTER_RANGE]),
      ],
      []
    )

    expect(groups.map((group) => group.parliamentNumber)).toEqual([10, 11])
  })

  it("places each Bill by the Member's first report on it, in date order", () => {
    const laterBill = buildBill('later', [
      buildBillReport('b', '2003-05-02', 10),
    ])
    const earlierBill = buildBill('earlier', [
      buildBillReport('a', '2002-04-01', 10),
      buildBillReport('c', '2003-06-01', 10),
    ])

    const groups = buildMemberTimelineGroups(
      [buildMembership(10, [DEPUTY_PRIME_MINISTER_RANGE])],
      [laterBill, earlierBill]
    )

    expect(groups[0].bills).toEqual([
      { bill: earlierBill, firstReport: earlierBill.reports[0] },
      { bill: laterBill, firstReport: laterBill.reports[0] },
    ])
  })

  it('keeps a Parliament that has Bills and no printed office', () => {
    const bill = buildBill('budget', [buildBillReport('a', '1992-03-10', 8)])

    const groups = buildMemberTimelineGroups([buildMembership(8, [])], [bill])

    expect(groups).toEqual([
      {
        parliamentNumber: 8,
        printedRanges: [],
        bills: [{ bill, firstReport: bill.reports[0] }],
      },
    ])
  })

  it('answers no groups for a person with no ranges and no Bills', () => {
    expect(buildMemberTimelineGroups([buildMembership(12, [])], [])).toEqual([])
  })
})

describe('getPrintedRangeSittingDates', () => {
  it('gives one date for a range of one sitting', () => {
    expect(getPrintedRangeSittingDates(ONE_SITTING_RANGE)).toEqual([
      '2006-02-27',
    ])
  })

  it('gives the first and last dates for a longer range', () => {
    expect(getPrintedRangeSittingDates(PRIME_MINISTER_RANGE)).toEqual([
      '2004-09-01',
      '2006-02-17',
    ])
  })
})

describe('formatPrintedRangeSittingCount', () => {
  it('uses the singular for one sitting', () => {
    expect(formatPrintedRangeSittingCount(1)).toBe('1 sitting')
  })

  it('uses the plural and groups thousands', () => {
    expect(formatPrintedRangeSittingCount(1234)).toBe('1,234 sittings')
  })
})

describe('formatPersonBillDates', () => {
  it('gives one date when every report falls on one sitting', () => {
    expect(
      formatPersonBillDates([
        buildBillReport('a', '1990-03-14', 7),
        buildBillReport('b', '1990-03-14', 7),
      ])
    ).toBe('14 March 1990')
  })

  it('gives the first and last report dates as a span', () => {
    expect(
      formatPersonBillDates([
        buildBillReport('a', '1990-03-14', 7),
        buildBillReport('b', '1990-03-16', 7),
      ])
    ).toBe('14 March 1990 to 16 March 1990')
  })
})

describe('formatPersonBillParagraphCount', () => {
  it('uses the singular for one paragraph', () => {
    const bill = buildBill('one', [buildBillReport('a', '1990-03-14', 7)], 1)

    expect(formatPersonBillParagraphCount(bill)).toBe('1 paragraph')
  })

  it('adds the reading and budget debate paragraphs', () => {
    const bill = buildBill(
      'both',
      [buildBillReport('a', '1990-03-14', 7)],
      2,
      3
    )

    expect(formatPersonBillParagraphCount(bill)).toBe('5 paragraphs')
  })
})

describe('isEveryPersonBillReportBudgetDebate', () => {
  it('is true when every report is a budget debate', () => {
    const bill = buildBill(
      'supply',
      [
        buildBillReport('a', '2010-03-01', 11, BillReportRole.BUDGET_DEBATE),
        buildBillReport('b', '2010-03-02', 11, BillReportRole.BUDGET_DEBATE),
      ],
      0,
      4
    )

    expect(isEveryPersonBillReportBudgetDebate(bill)).toBe(true)
  })

  it('is false when one report is a reading', () => {
    const bill = buildBill('supply', [
      buildBillReport('a', '2010-03-01', 11, BillReportRole.BUDGET_DEBATE),
      buildBillReport('b', '2010-03-09', 11),
    ])

    expect(isEveryPersonBillReportBudgetDebate(bill)).toBe(false)
  })
})
