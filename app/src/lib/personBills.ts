import type { PersonBillData } from '@/api/people/getPersonBills'
import type { MemberTimelineBill } from '@/lib/memberTimeline'

export interface PersonBillGroup {
  parliamentNumber: number
  bills: MemberTimelineBill[]
}

function compareByFirstReportNewestFirst(
  first: MemberTimelineBill,
  second: MemberTimelineBill
): number {
  return (
    second.firstReport.sitting_date.localeCompare(
      first.firstReport.sitting_date
    ) || second.bill.bill_key.localeCompare(first.bill.bill_key)
  )
}

export function groupPersonBillsByParliament(
  bills: PersonBillData[]
): PersonBillGroup[] {
  const parliamentToBills = new Map<number, MemberTimelineBill[]>()
  for (const bill of bills) {
    const firstReport = bill.reports[0]
    const parliamentBills =
      parliamentToBills.get(firstReport.parliament_number) ?? []
    parliamentBills.push({ bill, firstReport })
    parliamentToBills.set(firstReport.parliament_number, parliamentBills)
  }
  return [...parliamentToBills]
    .sort(([first], [second]) => second - first)
    .map(([parliamentNumber, parliamentBills]) => ({
      parliamentNumber,
      bills: parliamentBills.sort(compareByFirstReportNewestFirst),
    }))
}

export function countPersonBillsByParliament(
  groups: PersonBillGroup[]
): Map<number, number> {
  return new Map(
    groups.map((group) => [group.parliamentNumber, group.bills.length])
  )
}

export function countPersonBills(groups: PersonBillGroup[]): number {
  return groups.reduce((sum, group) => sum + group.bills.length, 0)
}

export function getPersonBillsAnchorId(parliamentNumber: number): string {
  return `bills-parliament-${parliamentNumber}`
}
