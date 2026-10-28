import { ApiError } from '@/api/client'
import type { GetReportResponse } from '@/api/reports/getReport'
import { useGetReport } from '@/api/reports/getReport'
import { useGetReportMatchedWords } from '@/api/reports/getReportMatchedWords'
import { PageHeader } from '@/components/layout/PageHeader'
import { TextSource } from '@/components/layout/TextSource'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ListReportMetadata } from '@/components/reports/ListReportMetadata'
import { ListSpeeches } from '@/components/reports/ListSpeeches'
import { NoticeErrorReport } from '@/components/reports/NoticeErrorReport'
import { NoticeNotFoundReport } from '@/components/reports/NoticeNotFoundReport'
import { NoticeReferencedReport } from '@/components/reports/NoticeReferencedReport'
import { NoticeRemovedReport } from '@/components/reports/NoticeRemovedReport'
import { NoticeTextNotPublished } from '@/components/reports/NoticeTextNotPublished'
import { NoticeTextUnavailable } from '@/components/reports/NoticeTextUnavailable'
import { PopoverReportType } from '@/components/reports/PopoverReportType'
import { SkeletonReport } from '@/components/reports/SkeletonReport'
import { TextReportProblem } from '@/components/reports/TextReportProblem'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { HTTP_GONE, HTTP_NOT_FOUND } from '@/constants/constants'
import {
  REFERENCED_WRITTEN_ANSWER_LABEL,
  REFERENCING_ORAL_ANSWER_LABEL,
  SPEECH_ANCHOR_MAX_LENGTH,
} from '@/constants/reports/constants'
import { SEARCH_WORDS_MAX_LENGTH } from '@/constants/search/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildReportCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { parseHighlightTerms } from '@/lib/highlight'
import { isTextPublished } from '@/lib/utils'
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

function isReportTextUnavailable(report: GetReportResponse) {
  return (
    !report.is_text_available &&
    isTextPublished(report.report_type, report.sitting_date)
  )
}

function renderBody(
  report: GetReportResponse,
  highlightTerms: string[],
  highlightWords: string[]
) {
  if (isReportTextUnavailable(report)) {
    return (
      <NoticeTextUnavailable officialRecordUrl={report.official_record_url} />
    )
  }
  if (!report.is_text_available) return <NoticeTextNotPublished />
  return (
    <ListSpeeches
      report={report}
      highlightTerms={highlightTerms}
      highlightWords={highlightWords}
    />
  )
}

export const Route = createFileRoute('/reports/$reportSlug')({
  validateSearch: reportSearchSchema,
  component: function PageReport() {
    const { reportSlug } = Route.useParams()
    const { hl, s, q } = Route.useSearch()
    const {
      data,
      isLoading,
      isError,
      isLoadingError,
      error,
      refetch,
      isRefetching,
    } = useGetReport({ report_slug: reportSlug, s, q })
    const highlightTerms = parseHighlightTerms(hl ?? '')
    const { data: matchedWordsResponse } = useGetReportMatchedWords({
      report_slug: reportSlug,
      q: highlightTerms.join(' '),
    })
    useDocumentTitle(data?.title ?? 'Report')

    function retryReport() {
      void refetch()
    }

    if (isLoading) return <SkeletonReport />
    if (
      isLoadingError &&
      error instanceof ApiError &&
      error.status === HTTP_NOT_FOUND
    ) {
      return <NoticeNotFoundReport />
    }
    // A takedown must hide a report already on screen, so a 410 wins over cached data.
    if (isError && error instanceof ApiError && error.status === HTTP_GONE) {
      return <NoticeRemovedReport />
    }
    if (isLoadingError || !data) {
      return (
        <NoticeErrorReport onRetry={retryReport} isRetrying={isRefetching} />
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title={data.title}
          aboveTitle={<PopoverReportType reportType={data.report_type} />}
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
              reportTitle={data.title}
              reportSlug={data.report_slug}
              officialRecordUrl={data.official_record_url}
            />
          }
        />
        <ListReportMetadata report={data} />
        {renderBody(data, highlightTerms, matchedWordsResponse?.words ?? [])}
        {data.referenced_written_answer !== null && (
          <NoticeReferencedReport
            label={REFERENCED_WRITTEN_ANSWER_LABEL}
            report={data.referenced_written_answer}
          />
        )}
        {data.referencing_oral_answer !== null && (
          <NoticeReferencedReport
            label={REFERENCING_ORAL_ANSWER_LABEL}
            report={data.referencing_oral_answer}
          />
        )}
        <TextSource
          sittingDate={data.sitting_date}
          officialRecordUrl={
            isReportTextUnavailable(data) ? null : data.official_record_url
          }
        />
        <TextReportProblem title={data.title} />
      </div>
    )
  },
})
