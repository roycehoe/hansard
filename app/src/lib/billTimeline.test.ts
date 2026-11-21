import type { GetActResponse } from '@/api/acts/getAct'
import type { ReportBillActData, ReportBillData } from '@/api/reports/getReport'
import { BillStage } from '@/constants/bills/enums'
import {
  findBillEntry,
  findTimelineAct,
  formatChangedActCount,
  getBillTimelineReadings,
  getTimelineOtherActs,
  isTimelineShown,
} from '@/lib/billTimeline'
import { describe, expect, it } from 'vitest'

function buildAct(
  ssoCode: string,
  title: string,
  isMade = false
): ReportBillActData {
  return { sso_code: ssoCode, title, is_made_by_bill: isMade }
}

function buildBill(
  acts: ReportBillActData[],
  reportSlugs: string[] = ['r1']
): ReportBillData {
  return {
    title: 'Some Bill',
    report_part: null,
    acts,
    reports: reportSlugs.map((slug) => ({
      report_slug: slug,
      sitting_date: `2024-01-0${slug.slice(1)}`,
      stages: [BillStage.SECOND_READING_AGREED],
    })),
  }
}

describe('isTimelineShown', () => {
  it('shows for a Bill that changed any Act, even with no lead Act', () => {
    const bill = buildBill([
      buildAct('A', 'Alpha Act'),
      buildAct('B', 'Beta Act'),
    ])
    expect(isTimelineShown(bill)).toBe(true)
  })

  it('shows for a Bill with more than one report and no Acts', () => {
    expect(isTimelineShown(buildBill([], ['r1', 'r2']))).toBe(true)
  })

  it('hides for a Bill with one report and no Acts', () => {
    expect(isTimelineShown(buildBill([]))).toBe(false)
  })
})

describe('getBillTimelineReadings', () => {
  it('lists the Bill readings oldest first', () => {
    const readings = getBillTimelineReadings(
      buildBill([], ['r3', 'r1', 'r2']).reports
    )
    expect(readings.map((reading) => reading.reportSlug)).toEqual([
      'r1',
      'r2',
      'r3',
    ])
  })
})

describe('getTimelineOtherActs', () => {
  const bill = buildBill([
    buildAct('C', 'charter Act'),
    buildAct('A', 'Alpha Act'),
    buildAct('B', 'Beta Act'),
  ])

  it('drops the lead Act and sorts the rest by title', () => {
    const others = getTimelineOtherActs(bill, bill.acts[1])
    expect(others.map((act) => act.sso_code)).toEqual(['B', 'C'])
  })

  it('keeps every Act when there is no lead Act', () => {
    expect(getTimelineOtherActs(bill, null)).toHaveLength(3)
  })
})

describe('formatChangedActCount', () => {
  it('words one and many', () => {
    expect(formatChangedActCount(1)).toBe('Changed 1 Act')
    expect(formatChangedActCount(1234)).toBe('Changed 1,234 Acts')
  })
})

describe('findBillEntry', () => {
  function buildEntry(ordinal: number, reportSlug: string | null) {
    return {
      ordinal,
      commencement_date: `2020-01-0${ordinal}`,
      bill:
        reportSlug === null ? null : { reports: [{ report_slug: reportSlug }] },
    }
  }

  it('finds the entry whose Bill has a reading on this Bill', () => {
    const act = {
      entries: [buildEntry(1, 'other'), buildEntry(2, 'r1')],
    } as unknown as GetActResponse
    expect(findBillEntry(act, buildBill([]))?.ordinal).toBe(2)
  })

  it('returns null when no entry matches', () => {
    const act = {
      entries: [buildEntry(1, null)],
    } as unknown as GetActResponse
    expect(findBillEntry(act, buildBill([]))).toBeNull()
  })
})

describe('findTimelineAct', () => {
  function buildTitledBill(title: string, acts: ReportBillActData[]) {
    return { ...buildBill(acts), title }
  }

  const acts = [
    buildAct('CPC2010', 'Criminal Procedure Code 2010'),
    buildAct('EA1893', 'Evidence Act 1893'),
    buildAct('PC1871', 'Penal Code 1871'),
    buildAct('WC1961', 'Women\u2019s Charter 1961'),
    buildAct('SCJA1969', 'Supreme Court of Judicature Act 1969'),
    buildAct('JSO1878', 'Jewish Synagogue Ordinance 1878'),
  ]

  it('matches a law that ends in Code', () => {
    const bill = buildTitledBill('Penal Code (Amendment) Bill', acts)
    expect(findTimelineAct(bill)?.sso_code).toBe('PC1871')
  })

  it('matches a law that ends in Charter, in capitals', () => {
    const bill = buildTitledBill('WOMEN\u2019S CHARTER (AMENDMENT) BILL', acts)
    expect(findTimelineAct(bill)?.sso_code).toBe('WC1961')
  })

  it('still matches a law that ends in Act', () => {
    const bill = buildTitledBill(
      'Supreme Court of Judicature (Amendment) Bill',
      acts
    )
    expect(findTimelineAct(bill)?.sso_code).toBe('SCJA1969')
  })

  it('matches an Ordinance', () => {
    const bill = buildTitledBill('Jewish Synagogue (Amendment) Bill', acts)
    expect(findTimelineAct(bill)?.sso_code).toBe('JSO1878')
  })

  it('names no Act when the title names none of several', () => {
    const bill = buildTitledBill(
      'Criminal Law (Miscellaneous Amendments) Bill',
      acts
    )
    expect(findTimelineAct(bill)).toBeNull()
  })
})
