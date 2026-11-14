import type { MemberTimelineBill } from '@/lib/memberTimeline'
import {
  formatPersonBillDates,
  formatPersonBillParagraphCount,
  isEveryPersonBillReportBudgetDebate,
} from '@/lib/memberTimeline'
import { Link } from '@tanstack/react-router'

interface ListPersonBillsProps {
  bills: MemberTimelineBill[]
}

export function ListPersonBills({ bills }: ListPersonBillsProps) {
  return (
    <ul>
      {bills.map(({ bill, firstReport }) => (
        <li
          key={bill.bill_key}
          className="border-separator flex flex-col gap-1 border-b py-3 last:border-b-0"
        >
          <Link
            to="/reports/$reportSlug"
            params={{ reportSlug: firstReport.report_slug }}
            className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
          >
            {bill.title}
          </Link>
          <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <span>{formatPersonBillDates(bill.reports)}</span>
            <span>{formatPersonBillParagraphCount(bill)}</span>
            {isEveryPersonBillReportBudgetDebate(bill) && (
              <span>Budget debate</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
