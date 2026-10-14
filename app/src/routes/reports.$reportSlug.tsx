import { ApiError } from '@/api/client'
import type { GetReportResponse } from '@/api/reports/getReport'
import { useGetReport } from '@/api/reports/getReport'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ListReportMetadata } from '@/components/reports/ListReportMetadata'
import { ListSpeeches } from '@/components/reports/ListSpeeches'
import { NoticeErrorReport } from '@/components/reports/NoticeErrorReport'
import { NoticeNoSpeeches } from '@/components/reports/NoticeNoSpeeches'
import { NoticeNotFoundReport } from '@/components/reports/NoticeNotFoundReport'
import { NoticeTextUnavailable } from '@/components/reports/NoticeTextUnavailable'
import { PopoverUnofficialTranscript } from '@/components/reports/PopoverUnofficialTranscript'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { HTTP_NOT_FOUND } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildReportCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

function renderBody(report: GetReportResponse) {
  if (!report.is_text_available) {
    return (
      <NoticeTextUnavailable officialRecordUrl={report.official_record_url} />
    )
  }
  if (report.speeches.length === 0) {
    return <NoticeNoSpeeches officialRecordUrl={report.official_record_url} />
  }
  return <ListSpeeches report={report} />
}

export const Route = createFileRoute('/reports/$reportSlug')({
  component: function PageReport() {
    const { reportSlug } = Route.useParams()
    const { data, isLoading, isError, error, refetch, isRefetching } =
      useGetReport({ report_slug: reportSlug })
    useDocumentTitle(data?.title ?? 'Report')

    function retryReport() {
      void refetch()
    }

    if (isLoading) return <Skeleton className="h-96 w-full" />
    if (
      isError &&
      error instanceof ApiError &&
      error.status === HTTP_NOT_FOUND
    ) {
      return <NoticeNotFoundReport />
    }
    if (isError || !data) {
      return (
        <NoticeErrorReport onRetry={retryReport} isRetrying={isRefetching} />
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title={data.title}
          description={data.subtitle || undefined}
          titleAddon={
            <PopoverUnofficialTranscript
              officialRecordUrl={data.official_record_url}
            />
          }
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/sittings/$sittingDate"
                      params={{ sittingDate: data.sitting_date }}
                    >
                      {formatSittingDate(data.sitting_date)}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Report</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          actions={
            <ButtonCopyCitation
              citation={buildReportCitation(
                data.sitting_date,
                data.volume_number,
                data.parliament_number
              )}
            />
          }
        />
        <ListReportMetadata report={data} />
        {renderBody(data)}
      </div>
    )
  },
})
