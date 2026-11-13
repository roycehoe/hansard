import type { ActEntryData, ActEntryReportData } from '@/api/acts/getAct'
import { ActEventKind } from '@/constants/acts/enums'
import { ActHistoryEntryKind, BillStage } from '@/constants/bills/enums'
import { ReportType } from '@/constants/reports/enums'
import type { ActEvent } from '@/lib/actTimeline'
import {
  countActEventsByKind,
  findOriginalEntryOrdinal,
  formatOtherActCount,
  formatShownActEventKinds,
  getActEventsNewestFirst,
  getAvailableActEventKinds,
  getReportLabels,
  isEntryBackdated,
  parseShownActEventKinds,
} from '@/lib/actTimeline'
import { describe, expect, it } from 'vitest'

function buildReport(
  sittingDate: string,
  stages: BillStage[],
  slug = `bill-${sittingDate}`
): ActEntryReportData {
  return {
    report_slug: slug,
    title: 'STRATEGIC GOODS (CONTROL) BILL',
    report_type: ReportType.BILL,
    sitting_date: sittingDate,
    stages,
  }
}

function buildEntry(
  ordinal: number,
  printedTitle: string,
  options: {
    kind?: ActHistoryEntryKind
    commencementDate?: string | null
    reports?: ActEntryReportData[]
    actCount?: number
  } = {}
): ActEntryData {
  const reports = options.reports ?? []
  return {
    ordinal,
    kind: options.kind ?? ActHistoryEntryKind.ACT,
    printed_title: printedTitle,
    printed_law_number: `Act ${ordinal}`,
    printed_bill_number: null,
    first_reading_date: null,
    second_reading_date: null,
    third_reading_date: null,
    commencement_date:
      options.commencementDate === undefined
        ? '2003-01-01'
        : options.commencementDate,
    bill_link_source: null,
    bill:
      reports.length === 0
        ? null
        : {
            bill_key: `bill-${ordinal}`,
            title: 'Strategic Goods (Control) Bill',
            first_sitting_date: reports[0].sitting_date,
            last_sitting_date: reports[reports.length - 1].sitting_date,
            is_passed: true,
            act_count: options.actCount ?? 1,
            reports,
          },
  }
}

function describeEvent(event: ActEvent): string {
  return event.kind === ActEventKind.READING
    ? event.report.report_slug
    : `${event.kind} ${event.entry.ordinal}`
}

describe('getReportLabels', () => {
  it('names each reading the record names', () => {
    expect(
      getReportLabels([
        buildReport('2002-10-31', [BillStage.FIRST_READING]),
        buildReport('2002-11-25', [
          BillStage.SECOND_READING_ORDER,
          BillStage.SECOND_READING_AGREED,
          BillStage.THIRD_READING,
        ]),
      ])
    ).toEqual(['First reading', 'Second reading, Third reading'])
  })

  it('reads Debate for a report with no reading before a second reading opens', () => {
    expect(
      getReportLabels([
        buildReport('2020-11-03', [BillStage.FIRST_READING]),
        buildReport('2021-01-04', []),
        buildReport('2021-01-05', [
          BillStage.SECOND_READING_AGREED,
          BillStage.THIRD_READING,
        ]),
      ])
    ).toEqual(['First reading', 'Debate', 'Second reading, Third reading'])
  })

  it('reads Second reading continued after a second reading opens', () => {
    expect(
      getReportLabels([
        buildReport('2026-05-05', [BillStage.SECOND_READING_ORDER]),
        buildReport('2026-05-05', []),
        buildReport('2026-05-05', [
          BillStage.SECOND_READING_AGREED,
          BillStage.THIRD_READING,
        ]),
      ])
    ).toEqual([
      'Second reading',
      'Second reading continued',
      'Second reading continued, Third reading',
    ])
  })
})

describe('isEntryBackdated', () => {
  it('is true when the Act is in force before its first debate', () => {
    const entry = buildEntry(1, 'Finance (Income Taxes) Act 2026', {
      commencementDate: '2025-05-01',
      reports: [buildReport('2026-09-08', [BillStage.FIRST_READING])],
    })
    expect(isEntryBackdated(entry)).toBe(true)
  })

  it('is false when the Act is in force after its debates', () => {
    const entry = buildEntry(1, 'Strategic Goods (Control) Act 2002', {
      commencementDate: '2003-01-01',
      reports: [buildReport('2002-10-31', [BillStage.FIRST_READING])],
    })
    expect(isEntryBackdated(entry)).toBe(false)
  })

  it('is false when no debate is on record', () => {
    const entry = buildEntry(1, 'Income Tax Ordinance 1947')
    expect(isEntryBackdated(entry)).toBe(false)
  })
})

describe('getActEventsNewestFirst', () => {
  it('lays every reading and In force date in one date order', () => {
    const entries = [
      buildEntry(1, 'Strategic Goods (Control) Act 2002', {
        commencementDate: '2003-01-01',
        reports: [
          buildReport('2002-10-31', [BillStage.FIRST_READING], 'first-2002'),
          buildReport('2002-11-25', [BillStage.THIRD_READING], 'third-2002'),
        ],
      }),
      buildEntry(2, 'International Enterprise Singapore Board Act 2003', {
        commencementDate: '2003-04-01',
        reports: [
          buildReport('2003-03-10', [BillStage.FIRST_READING], 'first-2003'),
        ],
      }),
    ]
    expect(getActEventsNewestFirst(entries).map(describeEvent)).toEqual([
      'legislation 2',
      'first-2003',
      'legislation 1',
      'third-2002',
      'first-2002',
    ])
  })

  it('puts a backdated In force below the readings, where its date falls', () => {
    const entries = [
      buildEntry(1, 'Finance (Income Taxes) Act 2026', {
        commencementDate: '2025-05-01',
        reports: [
          buildReport('2026-09-08', [BillStage.FIRST_READING], 'first'),
          buildReport('2026-10-06', [BillStage.THIRD_READING], 'third'),
        ],
      }),
    ]
    expect(getActEventsNewestFirst(entries).map(describeEvent)).toEqual([
      'third',
      'first',
      'legislation 1',
    ])
  })

  it('keeps an undated entry just above the entry before it in the record', () => {
    const entries = [
      buildEntry(1, 'First', { commencementDate: '1950-01-01' }),
      buildEntry(2, 'Parliamentary Resolution', {
        kind: ActHistoryEntryKind.SUBSIDIARY_LEGISLATION,
        commencementDate: null,
      }),
      buildEntry(3, 'Later', { commencementDate: '1990-01-01' }),
    ]
    expect(getActEventsNewestFirst(entries).map(describeEvent)).toEqual([
      'legislation 3',
      'legislation 2',
      'legislation 1',
    ])
  })

  it('puts In force above a reading on the same day, and the later of two same-day readings first', () => {
    const entries = [
      buildEntry(1, 'Cybersecurity Act 2018', {
        commencementDate: '2018-02-05',
        reports: [
          buildReport('2018-02-05', [BillStage.SECOND_READING_ORDER], 'opens'),
          buildReport('2018-02-05', [BillStage.THIRD_READING], 'closes'),
        ],
      }),
    ]
    expect(getActEventsNewestFirst(entries).map(describeEvent)).toEqual([
      'legislation 1',
      'closes',
      'opens',
    ])
  })

  it('marks only the newest reading of a Bill', () => {
    const entries = [
      buildEntry(1, 'Strategic Goods (Control) Act 2002', {
        reports: [
          buildReport('2002-10-31', [BillStage.FIRST_READING], 'first'),
          buildReport('2002-11-25', [BillStage.THIRD_READING], 'third'),
        ],
      }),
    ]
    const newestReadings = getActEventsNewestFirst(entries)
      .filter(
        (event) => event.kind === ActEventKind.READING && event.isNewestReading
      )
      .map(describeEvent)
    expect(newestReadings).toEqual(['third'])
  })
})

describe('event kind filter', () => {
  const entries = [
    buildEntry(1, 'Strategic Goods (Control) Act 2002', {
      reports: [buildReport('2002-10-31', [BillStage.FIRST_READING])],
    }),
    buildEntry(2, 'Strategic Goods (Control) Act 2002', {
      kind: ActHistoryEntryKind.REVISED_EDITION,
      commencementDate: '2021-12-31',
    }),
  ]
  const counts = countActEventsByKind(getActEventsNewestFirst(entries))
  const availableKinds = getAvailableActEventKinds(counts)

  it('counts each kind and offers only the kinds the Act has', () => {
    expect(counts).toEqual({
      [ActEventKind.READING]: 1,
      [ActEventKind.LEGISLATION]: 2,
    })
    expect(availableKinds).toEqual([
      ActEventKind.READING,
      ActEventKind.LEGISLATION,
    ])
  })

  it('shows every kind when the address names none, and ignores unknown names', () => {
    expect(parseShownActEventKinds(undefined, availableKinds)).toEqual(
      availableKinds
    )
    expect(
      parseShownActEventKinds('legislation,nonsense', availableKinds)
    ).toEqual([ActEventKind.LEGISLATION])
    expect(parseShownActEventKinds('', availableKinds)).toEqual([])
  })

  it('leaves the address empty when every kind is shown', () => {
    expect(formatShownActEventKinds(availableKinds, availableKinds)).toBe(
      undefined
    )
    expect(
      formatShownActEventKinds([ActEventKind.READING], availableKinds)
    ).toBe('reading')
  })
})

describe('findOriginalEntryOrdinal', () => {
  it('finds the earliest law with the Act name, as an Ordinance', () => {
    const entries = [
      buildEntry(1, 'Income Tax Ordinance 1947', {
        kind: ActHistoryEntryKind.ORDINANCE,
        commencementDate: '1948-01-01',
      }),
      buildEntry(2, 'Income Tax (Amendment) Ordinance 1948', {
        kind: ActHistoryEntryKind.ORDINANCE,
        commencementDate: '1948-01-01',
      }),
    ]
    expect(findOriginalEntryOrdinal('Income Tax Act 1947', entries)).toBe(1)
  })

  it('skips a first entry that is another law', () => {
    const entries = [
      buildEntry(1, 'Supreme Court of Judicature (Amendment) Act 2019', {
        commencementDate: '2021-01-02',
        reports: [buildReport('2019-10-07', [BillStage.FIRST_READING])],
      }),
      buildEntry(2, 'Payment Services Act 2019', {
        commencementDate: '2020-01-28',
        reports: [buildReport('2018-11-19', [BillStage.FIRST_READING])],
      }),
    ]
    expect(findOriginalEntryOrdinal('Payment Services Act 2019', entries)).toBe(
      2
    )
  })

  it('never tags a Revised Edition', () => {
    const entries = [
      buildEntry(1, 'Geographical Indications Act 2014', {
        kind: ActHistoryEntryKind.REVISED_EDITION,
        commencementDate: '2021-12-31',
      }),
    ]
    expect(
      findOriginalEntryOrdinal('Geographical Indications Act 2014', entries)
    ).toBeNull()
  })

  it('reads the chapter, punctuation and a leading The as the same name', () => {
    const entries = [
      buildEntry(1, 'The Wills Act, 1838', {
        kind: ActHistoryEntryKind.OTHER,
        commencementDate: '1838-01-01',
      }),
    ]
    expect(findOriginalEntryOrdinal('Wills Act 1838', entries)).toBe(1)
  })
})

describe('formatOtherActCount', () => {
  it('counts the other Acts a Bill changed', () => {
    expect(formatOtherActCount(104)).toBe('Also changed 103 other Acts')
    expect(formatOtherActCount(2)).toBe('Also changed 1 other Act')
  })

  it('says nothing when the Bill changed this Act alone', () => {
    expect(formatOtherActCount(1)).toBeNull()
  })
})
