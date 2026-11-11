import type { SittingReportData } from '@/api/sittings/getSitting'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { Badge } from '@/components/ui/badge'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { isTextPublished } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

interface ListSittingReportsProps {
  reports: SittingReportData[]
  sittingDate: string
}

export function ListSittingReports({
  reports,
  sittingDate,
}: ListSittingReportsProps) {
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
            className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
          >
            {report.title}
          </Link>
          {report.subtitle !== '' && (
            <span className="text-muted-foreground text-sm">
              {report.subtitle}
            </span>
          )}
          <BadgeReportType
            reportType={report.report_type}
            variant="tag-quiet"
          />
          {!report.is_text_available &&
            isTextPublished(report.report_type, sittingDate) && (
              <Badge variant="outline">{TEXT_NOT_IN_ARCHIVE_LABEL}</Badge>
            )}
        </li>
      ))}
    </ol>
  )
}
