import type { ActEntryReportData } from '@/api/acts/getAct'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { BILL_STAGE_LABELS } from '@/constants/bills/constants'
import type { BillStage } from '@/constants/bills/enums'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

function getStageLabels(stages: BillStage[]): string[] {
  return [...new Set(stages.map((stage) => BILL_STAGE_LABELS[stage]))]
}

interface ListActEntryReportsProps {
  billTitle: string
  reports: ActEntryReportData[]
}

export function ListActEntryReports({
  billTitle,
  reports,
}: ListActEntryReportsProps) {
  if (reports.length === 0) return null

  return (
    <ol>
      {reports.map((report) => {
        const stageLabels = getStageLabels(report.stages)
        // NOTE: the entry's heading stands for the Bill, so a report shows its own title only where the record prints it differently from the Bill's (ADR 0006)
        const isTitlePrintedDifferently =
          report.title.toLowerCase() !== billTitle.toLowerCase()
        return (
          <li
            key={report.report_slug}
            className="border-separator space-y-1 border-b py-3 last:border-b-0"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/reports/$reportSlug"
                params={{ reportSlug: report.report_slug }}
                className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
              >
                {formatSittingDate(report.sitting_date)}
              </Link>
              <BadgeReportType
                reportType={report.report_type}
                variant="tag-quiet"
              />
              {stageLabels.length > 0 && (
                <span className="text-muted-foreground text-sm">
                  {stageLabels.join(', ')}
                </span>
              )}
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
