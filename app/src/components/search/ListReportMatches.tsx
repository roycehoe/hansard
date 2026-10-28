import type { ReportMatchData } from '@/api/search/getSearchReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { TextMatchCount } from '@/components/search/TextMatchCount'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import {
  EMPTY_FILTERS_DESCRIPTION,
  EMPTY_WORDS_DESCRIPTION,
} from '@/constants/search/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { isTextPublished } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import type { ReactNode } from 'react'

const EMPTY_WORDS_TITLE = 'No title matches'
const EMPTY_FILTERS_TITLE = 'No reports'

interface ListReportMatchesProps {
  results: ReportMatchData[]
  hasWords: boolean
  highlightWords: string | undefined
  totalCount: number
  isTotalCapped: boolean
  sortControl: ReactNode
}

export function ListReportMatches({
  results,
  hasWords,
  highlightWords,
  totalCount,
  isTotalCapped,
  sortControl,
}: ListReportMatchesProps) {
  return (
    <div className="space-y-4">
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
          <TextMatchCount
            shownCount={results.length}
            totalCount={totalCount}
            isTotalCapped={isTotalCapped}
            singularNoun={hasWords ? 'title match' : 'report'}
            pluralNoun={hasWords ? 'title matches' : 'reports'}
            hasWords={hasWords}
            sortControl={sortControl}
          />
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
                    search={{ hl: highlightWords }}
                    className="text-primary visited:text-visited hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {result.title}
                  </Link>
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>{formatSittingDate(result.sitting_date)}</span>
                  <span>{formatParliament(result.parliament_number)}</span>
                  <BadgeReportType reportType={result.report_type} />
                  {!result.is_text_available &&
                    isTextPublished(
                      result.report_type,
                      result.sitting_date
                    ) && <span>{TEXT_NOT_IN_ARCHIVE_LABEL}</span>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
