import type { ReferencedReportData } from '@/api/reports/getReport'
import {
  BACK_TO_SITTING_LABEL,
  NEXT_REPORT_LABEL,
  PREVIOUS_REPORT_LABEL,
} from '@/constants/reports/constants'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

interface ListReportNeighboursProps {
  sittingDate: string
  previousReport: ReferencedReportData | null
  nextReport: ReferencedReportData | null
}

interface RowNeighbourProps {
  label: string
  sittingDate: string
  // NOTE: report responses are cached for an hour, so just after a release one can arrive without this field; the row then falls back to the sitting link rather than crashing the page
  report: ReferencedReportData | null | undefined
}

const LINK_CLASS_NAME =
  'text-link visited:text-visited focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

function RowNeighbour({ label, sittingDate, report }: RowNeighbourProps) {
  return (
    <li className="min-w-0 text-sm">
      <p className="text-muted-foreground">
        {report ? label : BACK_TO_SITTING_LABEL}
      </p>
      {report ? (
        <Link
          to="/reports/$reportSlug"
          params={{ reportSlug: report.report_slug }}
          className={LINK_CLASS_NAME}
        >
          {report.title}
        </Link>
      ) : (
        <Link
          to="/sittings/$sittingDate"
          params={{ sittingDate }}
          className={LINK_CLASS_NAME}
        >
          {formatSittingDate(sittingDate)}
        </Link>
      )}
    </li>
  )
}

export function ListReportNeighbours({
  sittingDate,
  previousReport,
  nextReport,
}: ListReportNeighboursProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-8">
      <RowNeighbour
        label={PREVIOUS_REPORT_LABEL}
        sittingDate={sittingDate}
        report={previousReport}
      />
      <RowNeighbour
        label={NEXT_REPORT_LABEL}
        sittingDate={sittingDate}
        report={nextReport}
      />
    </ul>
  )
}
