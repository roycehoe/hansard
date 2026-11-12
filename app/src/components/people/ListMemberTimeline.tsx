import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import {
  MEMBERSHIP_CONTINUED_NOTE,
  OFFICE_DATES_DEFINITION,
} from '@/constants/people/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import type { MemberTimelineGroup } from '@/lib/memberTimeline'
import {
  formatPersonBillDates,
  formatPersonBillParagraphCount,
  formatPrintedRangeSittingCount,
  getPrintedRangeSittingDates,
  isEveryPersonBillReportBudgetDebate,
} from '@/lib/memberTimeline'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

interface ListMemberTimelineProps {
  groups: MemberTimelineGroup[]
}

const ROW_CLASS_NAME =
  'border-separator flex flex-col gap-1 border-b py-3 last:border-b-0'

const META_CLASS_NAME =
  'text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm'

const LINK_CLASS_NAME =
  'text-link visited:text-visited focus-visible:decoration-ring outline-hidden hover:underline focus-visible:underline'

const PART_LABEL_CLASS_NAME = 'text-muted-foreground text-sm'

export function ListMemberTimeline({ groups }: ListMemberTimelineProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.parliamentNumber} className="space-y-4">
          <h3 className="font-serif text-lg lg:text-xl">
            {formatParliament(group.parliamentNumber)}
          </h3>
          {group.isContinuedIntoParliament1 && (
            <p className={PART_LABEL_CLASS_NAME}>{MEMBERSHIP_CONTINUED_NOTE}</p>
          )}
          {group.printedRanges.length > 0 && (
            <div>
              <PopoverDefinition definition={OFFICE_DATES_DEFINITION}>
                <span
                  className={cn(PART_LABEL_CLASS_NAME, DEFINED_TERM_CLASS_NAME)}
                >
                  Offices
                </span>
              </PopoverDefinition>
              <ul>
                {group.printedRanges.map((printedRange) => (
                  <li
                    key={`${printedRange.first_print.sitting_date}-${printedRange.office_printed}`}
                    className={ROW_CLASS_NAME}
                  >
                    <span>{printedRange.office_printed}</span>
                    <span className={META_CLASS_NAME}>
                      <span>
                        {getPrintedRangeSittingDates(printedRange).map(
                          (sittingDate, index) => (
                            <span key={sittingDate}>
                              {index > 0 && ' to '}
                              <Link
                                to="/sittings/$sittingDate"
                                params={{ sittingDate }}
                                className={LINK_CLASS_NAME}
                              >
                                {formatSittingDate(sittingDate)}
                              </Link>
                            </span>
                          )
                        )}
                      </span>
                      <span>
                        {formatPrintedRangeSittingCount(
                          printedRange.sitting_count
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {group.bills.length > 0 && (
            <div>
              <p className={PART_LABEL_CLASS_NAME}>Bills</p>
              <ul>
                {group.bills.map(({ bill, firstReport }) => (
                  <li key={bill.bill_key} className={ROW_CLASS_NAME}>
                    <Link
                      to="/reports/$reportSlug"
                      params={{ reportSlug: firstReport.report_slug }}
                      className={cn(LINK_CLASS_NAME, 'font-medium')}
                    >
                      {bill.title}
                    </Link>
                    <span className={META_CLASS_NAME}>
                      <span>{formatPersonBillDates(bill.reports)}</span>
                      <span>{formatPersonBillParagraphCount(bill)}</span>
                      {isEveryPersonBillReportBudgetDebate(bill) && (
                        <span>Budget debate</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
