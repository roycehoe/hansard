import type {
  PersonBillData,
  PersonBillReportData,
} from '@/api/people/getPersonBills'
import { BillReportRole } from '@/constants/bills/enums'
import {
  countPersonBills,
  countPersonBillsByParliament,
  getPersonBillsAnchorId,
  groupPersonBillsByParliament,
} from '@/lib/personBills'
import { describe, expect, it } from 'vitest'

function buildBillReport(
  sittingDate: string,
  parliamentNumber: number
): PersonBillReportData {
  return {
    report_slug: `bill-${sittingDate}`,
    sitting_date: sittingDate,
    parliament_number: parliamentNumber,
    role: BillReportRole.READING,
  }
}

function buildBill(
  billKey: string,
  reports: PersonBillReportData[]
): PersonBillData {
  return {
    bill_key: billKey,
    title: `${billKey} Bill`,
    first_sitting_date: reports[0].sitting_date,
    last_sitting_date: reports[reports.length - 1].sitting_date,
    is_passed: true,
    act_count: 0,
    printed_speakers: [],
    reading_speech_count: 1,
    budget_debate_speech_count: 0,
    reading_report_count: reports.length,
    budget_debate_report_count: 0,
    reports,
  }
}

const LEGISLATIVE_ASSEMBLY_BILL = buildBill('referendum', [
  buildBillReport('1962-03-14', 0),
  buildBillReport('1962-07-06', 0),
])

const PARLIAMENT_2_EARLY_BILL = buildBill('early', [
  buildBillReport('1969-03-04', 2),
])

const PARLIAMENT_2_LATE_BILL = buildBill('late', [
  buildBillReport('1971-11-24', 2),
])

const SPANNING_BILL = buildBill('spanning', [
  buildBillReport('1984-07-24', 5),
  buildBillReport('1985-01-25', 6),
])

describe('groupPersonBillsByParliament', () => {
  it('puts the newest Parliament first and the newest Bill first in each', () => {
    const groups = groupPersonBillsByParliament([
      PARLIAMENT_2_EARLY_BILL,
      LEGISLATIVE_ASSEMBLY_BILL,
      PARLIAMENT_2_LATE_BILL,
    ])

    expect(
      groups.map((group) => ({
        parliamentNumber: group.parliamentNumber,
        billKeys: group.bills.map(({ bill }) => bill.bill_key),
      }))
    ).toEqual([
      { parliamentNumber: 2, billKeys: ['late', 'early'] },
      { parliamentNumber: 0, billKeys: ['referendum'] },
    ])
  })

  it('keeps a Bill debated over several sittings as one row', () => {
    const [group] = groupPersonBillsByParliament([LEGISLATIVE_ASSEMBLY_BILL])

    expect(group.bills).toHaveLength(1)
    expect(group.bills[0].firstReport.sitting_date).toBe('1962-03-14')
  })

  it("files a Bill under the Parliament of the member's first report on it", () => {
    const groups = groupPersonBillsByParliament([SPANNING_BILL])

    expect(groups.map((group) => group.parliamentNumber)).toEqual([5])
  })

  it('orders Bills of one sitting by key, newest key first', () => {
    const first = buildBill('a', [buildBillReport('2022-11-28', 14)])
    const second = buildBill('b', [buildBillReport('2022-11-28', 14)])

    const [group] = groupPersonBillsByParliament([first, second])

    expect(group.bills.map(({ bill }) => bill.bill_key)).toEqual(['b', 'a'])
  })

  it('gives no groups for a person with no Bills', () => {
    expect(groupPersonBillsByParliament([])).toEqual([])
  })
})

describe('countPersonBillsByParliament', () => {
  it('counts the Bills of each Parliament', () => {
    const groups = groupPersonBillsByParliament([
      LEGISLATIVE_ASSEMBLY_BILL,
      PARLIAMENT_2_EARLY_BILL,
      PARLIAMENT_2_LATE_BILL,
    ])

    expect(countPersonBillsByParliament(groups)).toEqual(
      new Map([
        [2, 2],
        [0, 1],
      ])
    )
  })
})

describe('countPersonBills', () => {
  it('counts every Bill once, the sum of the counts by Parliament', () => {
    const groups = groupPersonBillsByParliament([
      LEGISLATIVE_ASSEMBLY_BILL,
      PARLIAMENT_2_EARLY_BILL,
      PARLIAMENT_2_LATE_BILL,
      SPANNING_BILL,
    ])
    const countByParliament = [
      ...countPersonBillsByParliament(groups).values(),
    ].reduce((sum, count) => sum + count, 0)

    expect(countPersonBills(groups)).toBe(4)
    expect(countPersonBills(groups)).toBe(countByParliament)
  })
})

describe('getPersonBillsAnchorId', () => {
  it('names the Legislative Assembly as Parliament 0', () => {
    expect(getPersonBillsAnchorId(0)).toBe('bills-parliament-0')
  })
})
