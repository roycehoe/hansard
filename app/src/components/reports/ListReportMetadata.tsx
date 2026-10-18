import type { GetReportResponse } from '@/api/reports/getReport'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { CONTACT_EMAIL } from '@/constants/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { buildErrorEmailHref } from '@/lib/utils'

interface ListReportMetadataProps {
  report: GetReportResponse
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

function buildReportProblemHref(title: string): string {
  return buildErrorEmailHref(
    `Problem on ${title}`,
    `${window.location.origin}${window.location.pathname}`
  )
}

export function ListReportMetadata({ report }: ListReportMetadataProps) {
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
      <dt className="text-muted-foreground text-sm font-medium">Date</dt>
      <dd>{formatSittingDate(report.sitting_date)}</dd>
      <dt className="text-muted-foreground text-sm font-medium">Parliament</dt>
      <dd>{formatParliament(report.parliament_number)}</dd>
      <dt className="text-muted-foreground text-sm font-medium">Volume</dt>
      <dd>{report.volume_number}</dd>
      {report.sitting_number !== null && (
        <>
          <dt className="text-muted-foreground text-sm font-medium">
            Sitting number
          </dt>
          <dd>{report.sitting_number}</dd>
        </>
      )}
      <dt className="text-muted-foreground text-sm font-medium">Type</dt>
      <dd>
        <BadgeReportType reportType={report.report_type} />
      </dd>
      {CONTACT_EMAIL && (
        <>
          <dt className="text-muted-foreground text-sm font-medium">
            Problems
          </dt>
          <dd>
            <a
              href={buildReportProblemHref(report.title)}
              className={LINK_CLASS_NAME}
            >
              Report a problem with this report
            </a>
          </dd>
        </>
      )}
    </dl>
  )
}
