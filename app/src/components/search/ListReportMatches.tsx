import type { ReportMatchData } from '@/api/search/getSearchReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import {
  EMPTY_FILTERS_DESCRIPTION,
  EMPTY_WORDS_DESCRIPTION,
  REPORTS_HEADING,
  TITLE_MATCHES_HEADING,
} from '@/constants/search/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

const EMPTY_WORDS_TITLE = 'No title matches'
const EMPTY_FILTERS_TITLE = 'No reports'

interface ListReportMatchesProps {
  results: ReportMatchData[]
  hasWords: boolean
}

export function ListReportMatches({
  results,
  hasWords,
}: ListReportMatchesProps) {
  return (
    <section aria-labelledby="title-matches-heading" className="space-y-4">
      <h2 id="title-matches-heading" className="font-serif text-xl lg:text-2xl">
        {hasWords ? TITLE_MATCHES_HEADING : REPORTS_HEADING}
      </h2>
      {results.length === 0 ? (
        <div role="status">
          <NoticeEmpty
            icon={SearchX}
            title={hasWords ? EMPTY_WORDS_TITLE : EMPTY_FILTERS_TITLE}
            description={
              hasWords ? EMPTY_WORDS_DESCRIPTION : EMPTY_FILTERS_DESCRIPTION
            }
          />
        </div>
      ) : (
        <>
          <p role="status" className="sr-only">
            {results.length} {hasWords ? 'title matches' : 'reports'} on this
            page
          </p>
          <ol>
            {results.map((result) => (
              <li
                key={result.report_slug}
                className="border-separator space-y-2 border-b py-4 last:border-b-0"
              >
                <h3 className="font-serif text-base font-semibold break-words lg:text-lg">
                  <Link
                    to="/reports/$reportSlug"
                    params={{ reportSlug: result.report_slug }}
                    className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {result.title}
                  </Link>
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>{formatSittingDate(result.sitting_date)}</span>
                  <span>{formatParliament(result.parliament_number)}</span>
                  <BadgeReportType reportType={result.report_type} />
                  {!result.is_text_available && (
                    <span>{TEXT_NOT_IN_ARCHIVE_LABEL}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
