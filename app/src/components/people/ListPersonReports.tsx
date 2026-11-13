import type { PersonReportData } from '@/api/people/getPersonReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { NUMBER_LOCALE } from '@/constants/constants'
import { PersonReportFilter } from '@/constants/people/enums'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

interface ListPersonReportsProps {
  reports: PersonReportData[]
  filter?: PersonReportFilter
  personName: string
}

export function ListPersonReports({
  reports,
  filter,
  personName,
}: ListPersonReportsProps) {
  if (reports.length === 0) {
    if (filter === PersonReportFilter.ASKED) {
      return (
        <NoticeEmpty
          icon={FileText}
          title="No questions asked"
          description={`The archive has no parliamentary questions credited to ${personName}.`}
        />
      )
    }
    return (
      <NoticeEmpty
        icon={FileText}
        title="No paragraphs by this person"
        description="No paragraphs by this person are in the archive yet."
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
            className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
          >
            {report.title}
          </Link>
          <span className="text-muted-foreground text-sm">
            {formatSittingDate(report.sitting_date)}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatParliament(report.parliament_number)}
          </span>
          <BadgeReportType
            reportType={report.report_type}
            variant="tag-quiet"
          />
          {report.speech_count > 0 && (
            <span className="text-muted-foreground text-sm">
              {report.speech_count.toLocaleString(NUMBER_LOCALE)}{' '}
              {report.speech_count === 1 ? 'paragraph' : 'paragraphs'}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
