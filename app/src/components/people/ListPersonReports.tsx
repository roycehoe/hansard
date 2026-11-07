import type { PersonReportData } from '@/api/people/getPersonReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { NoticeErrorLoadMore } from '@/components/layout/NoticeErrorLoadMore'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FILTER_ALL, NUMBER_LOCALE } from '@/constants/constants'
import { PERSON_REPORT_PREVIEW_ROW_COUNT } from '@/constants/people/constants'
import { PersonReportFilter } from '@/constants/people/enums'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { useState } from 'react'

const EXPANDED_STORAGE_VALUE = 'true'

function readIsExpanded(storageKey: string): boolean {
  try {
    return sessionStorage.getItem(storageKey) === EXPANDED_STORAGE_VALUE
  } catch {
    /* storage unavailable: start with the first rows */
    return false
  }
}

function storeIsExpanded(storageKey: string) {
  try {
    sessionStorage.setItem(storageKey, EXPANDED_STORAGE_VALUE)
  } catch {
    /* storage unavailable: the rows stay open until the page unmounts */
  }
}

interface ListPersonReportsProps {
  personId: number
  reports: PersonReportData[]
  reportCount: number
  filter?: PersonReportFilter
  personName: string
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onLoadMore: () => void
}

export function ListPersonReports({
  personId,
  reports,
  reportCount,
  filter,
  personName,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: ListPersonReportsProps) {
  const storageKey = `${personId}${filter ?? FILTER_ALL}ReportsExpanded`
  const [isExpanded, setIsExpanded] = useState<boolean>(() =>
    readIsExpanded(storageKey)
  )
  const shownReports = isExpanded
    ? reports
    : reports.slice(0, PERSON_REPORT_PREVIEW_ROW_COUNT)
  const hasMoreReports = shownReports.length < reports.length || hasNextPage

  function showMoreReports() {
    if (isExpanded) {
      onLoadMore()
      return
    }
    storeIsExpanded(storageKey)
    setIsExpanded(true)
  }

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
    <div className="space-y-4">
      <ol>
        {shownReports.map((report) => (
          <li
            key={report.report_slug}
            className="border-separator flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-3 last:border-b-0"
          >
            <Link
              to="/reports/$reportSlug"
              params={{ reportSlug: report.report_slug }}
              className="text-primary visited:text-visited hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
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
            {report.speech_count > 0 && (
              <span className="text-muted-foreground text-sm">
                {report.speech_count.toLocaleString(NUMBER_LOCALE)}{' '}
                {report.speech_count === 1 ? 'paragraph' : 'paragraphs'}
              </span>
            )}
          </li>
        ))}
      </ol>
      {hasMoreReports && !isFetchNextPageError && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-muted-foreground text-sm">
            Showing {shownReports.length.toLocaleString(NUMBER_LOCALE)} of{' '}
            {reportCount.toLocaleString(NUMBER_LOCALE)}.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={showMoreReports}
          >
            {isFetchingNextPage ? (
              <>
                <Spinner />
                Showing more reports…
              </>
            ) : (
              'Show more reports'
            )}
          </Button>
        </div>
      )}
      {isFetchNextPageError && (
        <NoticeErrorLoadMore
          onRetry={onLoadMore}
          isRetrying={isFetchingNextPage}
        />
      )}
    </div>
  )
}
