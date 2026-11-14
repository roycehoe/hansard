import type { GetReportResponse } from '@/api/reports/getReport'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ListReportMetadata } from '@/components/reports/ListReportMetadata'
import { PopoverReportType } from '@/components/reports/PopoverReportType'
import { PopoverTimeline } from '@/components/reports/PopoverTimeline'
import { TextAskedBy } from '@/components/reports/TextAskedBy'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PAGE_TITLE_CLASS_NAME } from '@/constants/constants'
import {
  REPORT_HEADER_ACTION_CLASS_NAME,
  REPORT_HEADER_CLASS_NAME,
  REPORT_HEADER_MAIN_CLASS_NAME,
  REPORT_HEADER_TRAIL_CLASS_NAME,
} from '@/constants/reports/constants'
import { isTimelineShown } from '@/lib/billTimeline'
import { buildReportCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

interface SectionReportHeaderProps {
  report: GetReportResponse
}

export function SectionReportHeader({ report }: SectionReportHeaderProps) {
  const timelineBill =
    report.bill !== null && isTimelineShown(report.bill) ? report.bill : null
  return (
    <div className={REPORT_HEADER_CLASS_NAME}>
      <Breadcrumb className={REPORT_HEADER_TRAIL_CLASS_NAME}>
        <BreadcrumbList>
          <BreadcrumbItem className="max-sm:hidden">
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="max-sm:hidden" />
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="max-sm:text-link max-sm:-my-1.5 max-sm:inline-flex max-sm:items-center max-sm:gap-1 max-sm:py-3 max-sm:font-medium"
            >
              <Link
                to="/sittings/$sittingDate"
                params={{ sittingDate: report.sitting_date }}
              >
                <ChevronLeft aria-hidden="true" className="size-4 sm:hidden" />
                {formatSittingDate(report.sitting_date)}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="max-sm:hidden" />
          <BreadcrumbItem className="max-sm:hidden">
            <BreadcrumbPage>Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className={REPORT_HEADER_MAIN_CLASS_NAME}>
        <div className="mb-0.5 flex">
          <PopoverReportType reportType={report.report_type} />
        </div>
        <h1 tabIndex={-1} className={PAGE_TITLE_CLASS_NAME}>
          {report.title}
        </h1>
        {report.subtitle && (
          <p className="text-muted-foreground max-w-prose text-base">
            {report.subtitle}
          </p>
        )}
        <TextAskedBy askers={report.askers} />
        <div className="mt-2">
          <ListReportMetadata report={report} />
        </div>
        {timelineBill !== null && (
          <div className="mt-3 sm:hidden">
            <PopoverTimeline
              key={report.report_slug}
              bill={timelineBill}
              reportSlug={report.report_slug}
              align="start"
            />
          </div>
        )}
      </div>
      <div className={cn(REPORT_HEADER_ACTION_CLASS_NAME, 'flex gap-2')}>
        {timelineBill !== null && (
          <div className="max-sm:hidden">
            <PopoverTimeline
              key={report.report_slug}
              bill={timelineBill}
              reportSlug={report.report_slug}
              align="end"
            />
          </div>
        )}
        <ButtonCopyCitation
          citation={buildReportCitation(
            report.sitting_date,
            report.volume_number,
            report.parliament_number
          )}
          reportTitle={report.title}
          reportSlug={report.report_slug}
          officialRecordUrl={report.official_record_url}
        />
      </div>
    </div>
  )
}
