import type { ReportMatchData } from '@/api/search/getSearchReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

interface ListReportMatchesProps {
  results: ReportMatchData[]
}

export function ListReportMatches({ results }: ListReportMatchesProps) {
  return (
    <section aria-labelledby="title-matches-heading" className="space-y-4">
      <h2 id="title-matches-heading" className="font-serif text-xl lg:text-2xl">
        Title matches
      </h2>
      {results.length === 0 ? (
        <div role="status">
          <NoticeEmpty
            icon={SearchX}
            title="No title matches"
            description='Nothing matches these words. Common words such as "the" are ignored. Try different words or a wider date range.'
          />
        </div>
      ) : (
        <>
          <p role="status" className="sr-only">
            {results.length} title matches on this page
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
