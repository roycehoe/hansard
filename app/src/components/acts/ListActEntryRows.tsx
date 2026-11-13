import type { ActEntryData } from '@/api/acts/getAct'
import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { BACKDATED_LABEL, IN_FORCE_LABEL } from '@/constants/acts/constants'
import { ActEntryRowKind } from '@/constants/acts/enums'
import { BACKDATED_DEFINITION } from '@/constants/constants'
import { getActEntryRows } from '@/lib/actTimeline'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

const ROW_CLASS_NAME =
  'border-separator space-y-1 border-b py-3 last:border-b-0'

const ROW_LINE_CLASS_NAME = 'flex flex-wrap items-center gap-x-3 gap-y-1'

const LABEL_CLASS_NAME = 'text-muted-foreground text-sm'

interface ListActEntryRowsProps {
  entry: ActEntryData
}

export function ListActEntryRows({ entry }: ListActEntryRowsProps) {
  const rows = getActEntryRows(entry)
  if (rows.length === 0) return null

  return (
    <ol>
      {rows.map((row) => {
        if (row.kind === ActEntryRowKind.IN_FORCE) {
          return (
            <li key={ActEntryRowKind.IN_FORCE} className={ROW_CLASS_NAME}>
              <div className={ROW_LINE_CLASS_NAME}>
                <span className="font-medium">
                  {formatSittingDate(row.date)}
                </span>
                <span className={LABEL_CLASS_NAME}>
                  {IN_FORCE_LABEL}
                  {row.isBackdated && (
                    <>
                      ,{' '}
                      <PopoverDefinition definition={BACKDATED_DEFINITION}>
                        <span className={DEFINED_TERM_CLASS_NAME}>
                          {BACKDATED_LABEL}
                        </span>
                      </PopoverDefinition>
                    </>
                  )}
                </span>
              </div>
            </li>
          )
        }
        const { report } = row
        // NOTE: the entry's heading stands for the Bill, so a report shows its own title only where the record prints it differently from the Bill's (ADR 0006)
        const isTitlePrintedDifferently =
          report.title.toLowerCase() !== entry.bill?.title.toLowerCase()
        return (
          <li key={report.report_slug} className={ROW_CLASS_NAME}>
            <div className={ROW_LINE_CLASS_NAME}>
              <Link
                to="/reports/$reportSlug"
                params={{ reportSlug: report.report_slug }}
                className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
              >
                {formatSittingDate(report.sitting_date)}
              </Link>
              <span className={LABEL_CLASS_NAME}>{row.label}</span>
            </div>
            {isTitlePrintedDifferently && (
              <p className="text-muted-foreground text-sm break-words">
                {report.title}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
