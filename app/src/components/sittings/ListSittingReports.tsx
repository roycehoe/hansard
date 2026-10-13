import type { SittingReportData } from '@/api/sittings/getSitting'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { Badge } from '@/components/ui/badge'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { Link } from '@tanstack/react-router'

interface ListSittingReportsProps {
  reports: SittingReportData[]
}

export function ListSittingReports({ reports }: ListSittingReportsProps) {
  return (
    <ol>
      {reports.map((report) => (
        <li
          key={report.report_slug}
          className="border-separator flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-3 last:border-b-0"
        >
          <Link
            to="/reports/$reportSlug"
            params={{ reportSlug: report.report_slug }}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {report.title}
          </Link>
          {report.subtitle !== '' && (
            <span className="text-muted-foreground text-sm">
              {report.subtitle}
            </span>
          )}
          <BadgeReportType reportType={report.report_type} />
          {!report.is_text_available && (
            <Badge variant="outline">{TEXT_NOT_IN_ARCHIVE_LABEL}</Badge>
          )}
        </li>
      ))}
    </ol>
  )
}
