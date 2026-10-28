import type { AdjacentReportData } from '@/api/reports/getReport'
import {
  ADJACENT_REPORTS_NAV_LABEL,
  NEXT_REPORT_LABEL,
  PREVIOUS_REPORT_LABEL,
} from '@/constants/reports/constants'
import { Link } from '@tanstack/react-router'

interface ListAdjacentReportsProps {
  previousReport: AdjacentReportData | null
  nextReport: AdjacentReportData | null
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function ListAdjacentReports({
  previousReport,
  nextReport,
}: ListAdjacentReportsProps) {
  if (previousReport === null && nextReport === null) return null

  const rows = [
    { label: PREVIOUS_REPORT_LABEL, report: previousReport },
    { label: NEXT_REPORT_LABEL, report: nextReport },
  ]

  return (
    <nav aria-label={ADJACENT_REPORTS_NAV_LABEL}>
      <ul>
        {rows.map(
          ({ label, report }) =>
            report !== null && (
              <li
                key={label}
                className="border-separator flex flex-col gap-1 border-b py-3 last:border-b-0"
              >
                <span className="text-muted-foreground text-sm">{label}</span>
                <Link
                  to="/reports/$reportSlug"
                  params={{ reportSlug: report.report_slug }}
                  className={LINK_CLASS_NAME}
                >
                  {report.title}
                </Link>
              </li>
            )
        )}
      </ul>
    </nav>
  )
}
