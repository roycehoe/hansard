import type { PersonReportData } from '@/api/people/getPersonReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

interface ListPersonReportsProps {
  reports: PersonReportData[]
}

export function ListPersonReports({ reports }: ListPersonReportsProps) {
  if (reports.length === 0) {
    return (
      <NoticeEmpty
        icon={FileText}
        title="No reports with speeches"
        description="No speeches by this person are in the archive yet."
      />
    )
  }

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
          <span className="text-muted-foreground text-sm">
            {formatSittingDate(report.sitting_date)}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatParliament(report.parliament_number)}
          </span>
          <BadgeReportType reportType={report.report_type} />
          <span className="text-muted-foreground text-sm">
            {report.speech_count} speeches
          </span>
        </li>
      ))}
    </ol>
  )
}
