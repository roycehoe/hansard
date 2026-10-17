import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
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
import { useMemo } from 'react'

const EMPTY_WORDS_TITLE = 'No speech matches'
const EMPTY_FILTERS_TITLE = 'No speeches'

function groupSpeechMatchesByReport(results: SpeechMatchData[]) {
  const speechesByReportSlug = new Map<string, SpeechMatchData[]>()
  for (const result of results) {
    const speeches = speechesByReportSlug.get(result.report_slug) ?? []
    speeches.push(result)
    speechesByReportSlug.set(result.report_slug, speeches)
  }
  return Array.from(speechesByReportSlug, ([reportSlug, speeches]) => ({
    reportSlug,
    speeches,
  }))
}

interface ListSpeechMatchesProps {
  results: SpeechMatchData[]
  heading: string
  hasWords: boolean
  highlightWords: string | undefined
  page: number
  pageSize: number
  totalCount: number
  isTotalCapped: boolean
}

export function ListSpeechMatches({
  results,
  heading,
  hasWords,
  highlightWords,
  page,
  pageSize,
  totalCount,
  isTotalCapped,
}: ListSpeechMatchesProps) {
  const reportGroups = useMemo(
    () => groupSpeechMatchesByReport(results),
    [results]
  )

  return (
    <section aria-labelledby="speech-matches-heading" className="space-y-4">
      <h2
        id="speech-matches-heading"
        className="font-serif text-xl lg:text-2xl"
      >
        {heading}
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
          <TextMatchCount
            page={page}
            pageSize={pageSize}
            shownCount={results.length}
            totalCount={totalCount}
            isTotalCapped={isTotalCapped}
            singularNoun={hasWords ? 'speech match' : 'speech'}
            pluralNoun={hasWords ? 'speech matches' : 'speeches'}
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
                    className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
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
                  speeches={group.speeches}
                  highlightWords={highlightWords}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
