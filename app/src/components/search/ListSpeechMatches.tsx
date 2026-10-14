import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import {
  EMPTY_FILTERS_DESCRIPTION,
  EMPTY_WORDS_DESCRIPTION,
} from '@/constants/search/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

const EMPTY_WORDS_TITLE = 'No speech matches'
const EMPTY_FILTERS_TITLE = 'No speeches'

interface ListSpeechMatchesProps {
  results: SpeechMatchData[]
  heading: string
  hasWords: boolean
}

export function ListSpeechMatches({
  results,
  heading,
  hasWords,
}: ListSpeechMatchesProps) {
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
          <p role="status" className="sr-only">
            {results.length} {hasWords ? 'speech matches' : 'speeches'} on this
            page
          </p>
          <ol>
            {results.map((result) => (
              <li
                key={`${result.report_slug}-${result.ordinal}`}
                className="border-separator space-y-2 border-b py-4 last:border-b-0"
              >
                <h3 className="font-serif text-base font-semibold break-words lg:text-lg">
                  <Link
                    to="/reports/$reportSlug"
                    params={{ reportSlug: result.report_slug }}
                    hash={`s${result.ordinal}`}
                    className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {result.title}
                  </Link>
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>{formatSittingDate(result.sitting_date)}</span>
                  <span>{formatParliament(result.parliament_number)}</span>
                  <BadgeReportType reportType={result.report_type} />
                </div>
                {result.speaker_label !== '' && (
                  <p>
                    {result.person_id !== null ? (
                      <Link
                        to="/people/$personSlug"
                        params={{
                          personSlug: `${result.person_id}-${result.person_slug}`,
                        }}
                        className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        {result.speaker_label}
                      </Link>
                    ) : (
                      <span className="font-semibold">
                        {result.speaker_label}
                      </span>
                    )}
                  </p>
                )}
                <SnippetHighlighted snippet={result.snippet} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
