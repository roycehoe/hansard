import type {
  GetSearchSpeechesRequest,
  SpeechMatchData,
} from '@/api/search/getSearchSpeeches'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { ListSpeechMatchesInReport } from '@/components/search/ListSpeechMatchesInReport'
import { TextMatchCount } from '@/components/search/TextMatchCount'
import {
  EMPTY_FILTERS_DESCRIPTION,
  EMPTY_WORDS_DESCRIPTION,
} from '@/constants/search/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

const EMPTY_WORDS_TITLE = 'No speech matches'
const EMPTY_FILTERS_TITLE = 'No speeches'

// A report keeps the matches from the page it first appeared on. Its matches
// on later pages are counted in report_match_count, so a group above the
// reader never grows.
function groupSpeechMatchesByReport(resultPages: SpeechMatchData[][]) {
  const reportSlugToGroup = new Map<
    string,
    { firstPageIndex: number; speeches: SpeechMatchData[] }
  >()
  resultPages.forEach((pageResults, pageIndex) => {
    for (const result of pageResults) {
      const group = reportSlugToGroup.get(result.report_slug)
      if (group === undefined) {
        reportSlugToGroup.set(result.report_slug, {
          firstPageIndex: pageIndex,
          speeches: [result],
        })
      } else if (group.firstPageIndex === pageIndex) {
        group.speeches.push(result)
      }
    }
  })
  return Array.from(reportSlugToGroup, ([reportSlug, group]) => ({
    reportSlug,
    speeches: group.speeches,
  }))
}

interface ListSpeechMatchesProps {
  resultPages: SpeechMatchData[][]
  searchRequest: GetSearchSpeechesRequest
  hasWords: boolean
  exactWord: string | undefined
  highlightWords: string | undefined
  totalCount: number
  isTotalCapped: boolean
  sortControl: ReactNode
}

export function ListSpeechMatches({
  resultPages,
  searchRequest,
  hasWords,
  exactWord,
  highlightWords,
  totalCount,
  isTotalCapped,
  sortControl,
}: ListSpeechMatchesProps) {
  const reportGroups = useMemo(
    () => groupSpeechMatchesByReport(resultPages),
    [resultPages]
  )

  return (
    <div className="space-y-4">
      {reportGroups.length === 0 ? (
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
            totalCount={totalCount}
            isTotalCapped={isTotalCapped}
            singularNoun={hasWords ? 'speech match' : 'speech'}
            pluralNoun={hasWords ? 'speech matches' : 'speeches'}
            hasWords={hasWords}
            exactWord={exactWord}
            sortControl={sortControl}
          />
          <ol>
            {reportGroups.map((group) => (
              <li
                key={group.reportSlug}
                className="border-separator space-y-2 border-b py-4 last:border-b-0"
              >
                <h3 className="font-serif text-base font-semibold break-words lg:text-lg">
                  <Link
                    to="/reports/$reportSlug"
                    params={{ reportSlug: group.reportSlug }}
                    search={{ hl: highlightWords }}
                    className="text-primary visited:text-visited hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {group.speeches[0].title}
                  </Link>
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>
                    {formatSittingDate(group.speeches[0].sitting_date)}
                  </span>
                  <span>
                    {formatParliament(group.speeches[0].parliament_number)}
                  </span>
                  <BadgeReportType reportType={group.speeches[0].report_type} />
                </div>
                <ListSpeechMatchesInReport
                  reportSlug={group.reportSlug}
                  speeches={group.speeches}
                  searchRequest={searchRequest}
                  highlightWords={highlightWords}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
