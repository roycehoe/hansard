import type {
  GetSearchSpeechesRequest,
  SpeechMatchData,
} from '@/api/search/getSearchSpeeches'
import { useGetSearchSpeechesByReport } from '@/api/search/getSearchSpeechesByReport'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { NUMBER_LOCALE } from '@/constants/constants'
import { VISIBLE_SPEECH_MATCHES_PER_REPORT } from '@/constants/search/constants'
import { Link } from '@tanstack/react-router'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm text-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const LOADING_ROW_COUNT = 2

interface ListSpeechMatchesInReportProps {
  reportSlug: string
  speeches: SpeechMatchData[]
  searchRequest: GetSearchSpeechesRequest
  highlightWords: string | undefined
}

export function ListSpeechMatchesInReport({
  reportSlug,
  speeches,
  searchRequest,
  highlightWords,
}: ListSpeechMatchesInReportProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const listId = useId()
  const reportMatches = useGetSearchSpeechesByReport(
    isExpanded ? { ...searchRequest, report: reportSlug } : undefined
  )
  const firstSpeeches = speeches.slice(0, VISIBLE_SPEECH_MATCHES_PER_REPORT)
  const firstOrdinals = new Set(firstSpeeches.map((speech) => speech.ordinal))
  const hiddenCount = speeches[0].report_match_count - firstSpeeches.length
  const moreSpeeches = (reportMatches.data?.results ?? []).filter(
    (speech) => !firstOrdinals.has(speech.ordinal)
  )
  const shownSpeeches = isExpanded
    ? [...firstSpeeches, ...moreSpeeches]
    : firstSpeeches
  const unfetchedCount = hiddenCount - moreSpeeches.length

  function toggleExpanded() {
    setIsExpanded((previous) => !previous)
  }

  function retryReportMatches() {
    void reportMatches.refetch()
  }

  function renderExpandedState() {
    if (!isExpanded) return undefined
    if (reportMatches.isLoading) {
      return Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
        <li key={`loading-${index}`} className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
        </li>
      ))
    }
    if (reportMatches.isLoadingError) {
      return (
        <li className="flex flex-wrap items-center gap-4">
          <div className="flex flex-row gap-4">
            <TriangleAlert className="text-destructive" />
            <p className="text-destructive">The other matches did not load.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={reportMatches.isRefetching}
            onClick={retryReportMatches}
          >
            {reportMatches.isRefetching ? (
              <>
                <Spinner />
                Retrying…
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4" />
                Try again
              </>
            )}
          </Button>
        </li>
      )
    }
    if (unfetchedCount <= 0) return undefined
    return (
      <li>
        <Link
          to="/reports/$reportSlug"
          params={{ reportSlug }}
          search={{ hl: highlightWords }}
          className={LINK_CLASS_NAME}
        >
          {unfetchedCount.toLocaleString(NUMBER_LOCALE)} more in the report
        </Link>
      </li>
    )
  }

  return (
    <>
      <ul
        id={listId}
        className="border-separator ml-1 space-y-4 border-l-2 pl-4"
      >
        {shownSpeeches.map((speech) => (
          <li key={speech.ordinal}>
            <Link
              to="/reports/$reportSlug"
              params={{ reportSlug: speech.report_slug }}
              search={{ hl: highlightWords }}
              hash={`s${speech.ordinal}`}
              hashScrollIntoView={false}
              className="group focus-visible:ring-ring focus-visible:ring-offset-background block space-y-1 rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {speech.speaker_label !== '' && (
                <p className="text-primary group-hover:text-primary-hover font-semibold group-hover:underline">
                  {speech.speaker_label}
                </p>
              )}
              <SnippetHighlighted snippet={speech.snippet} />
            </Link>
          </li>
        ))}
        {renderExpandedState()}
      </ul>
      {hiddenCount > 0 && (
        <div className="ml-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={toggleExpanded}
          >
            {isExpanded
              ? 'Show fewer'
              : `${hiddenCount.toLocaleString(NUMBER_LOCALE)} more in this report`}
          </Button>
        </div>
      )}
    </>
  )
}
