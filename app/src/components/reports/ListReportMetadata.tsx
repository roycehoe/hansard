import type { GetReportResponse } from '@/api/reports/getReport'
import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import {
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPES_LINK_LABEL,
} from '@/constants/reports/constants'
import type { ReportType } from '@/constants/reports/enums'
import { formatParliament, formatSittingDate } from '@/lib/format'

interface ListReportMetadataProps {
  report: GetReportResponse
}

export function ListReportMetadata({ report }: ListReportMetadataProps) {
  function renderReportType() {
    const definition =
      REPORT_TYPE_DESCRIPTIONS[report.report_type as ReportType]
    const badge = (
      <BadgeReportType
        reportType={report.report_type}
        className={definition ? DEFINED_TERM_CLASS_NAME : undefined}
      />
    )
    if (!definition) return badge
    return (
      <PopoverDefinition
        definition={definition}
        termsLinkLabel={REPORT_TYPES_LINK_LABEL}
      >
        {badge}
      </PopoverDefinition>
    )
  }

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
      <dd>{renderReportType()}</dd>
    </dl>
  )
}
