import { ApiError } from '@/api/client'
import type { GetReportResponse } from '@/api/reports/getReport'
import { useGetReport } from '@/api/reports/getReport'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ListReportMetadata } from '@/components/reports/ListReportMetadata'
import { ListSpeeches } from '@/components/reports/ListSpeeches'
import { NoticeErrorReport } from '@/components/reports/NoticeErrorReport'
import { NoticeNotFoundReport } from '@/components/reports/NoticeNotFoundReport'
import { NoticeRemovedReport } from '@/components/reports/NoticeRemovedReport'
import { NoticeTextUnavailable } from '@/components/reports/NoticeTextUnavailable'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { HTTP_GONE, HTTP_NOT_FOUND } from '@/constants/constants'
import { SPEECH_ANCHOR_MAX_LENGTH } from '@/constants/reports/constants'
import { SEARCH_WORDS_MAX_LENGTH } from '@/constants/search/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildReportCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { parseHighlightTerms } from '@/lib/highlight'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

const reportSearchSchema = z.object({
  hl: z.string().max(SEARCH_WORDS_MAX_LENGTH).optional().catch(undefined),
  s: z.coerce.number().int().min(0).optional().catch(undefined),
  q: z
    .union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().max(SPEECH_ANCHOR_MAX_LENGTH))
    .optional()
    .catch(undefined),
})

function renderBody(report: GetReportResponse, highlightTerms: string[]) {
  if (!report.is_text_available) {
    return <NoticeTextUnavailable />
  }
  return <ListSpeeches report={report} highlightTerms={highlightTerms} />
}

export const Route = createFileRoute('/reports/$reportSlug')({
  validateSearch: reportSearchSchema,
  component: function PageReport() {
    const { reportSlug } = Route.useParams()
    const { hl, s, q } = Route.useSearch()
    const { data, isLoading, isError, error, refetch, isRefetching } =
      useGetReport({ report_slug: reportSlug, s, q })
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
    if (isError && error instanceof ApiError && error.status === HTTP_GONE) {
      return <NoticeRemovedReport />
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
        {renderBody(data, parseHighlightTerms(hl ?? ''))}
      </div>
    )
  },
})
